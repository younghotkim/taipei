import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  photoBucket,
  tripId
} from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase storage not configured" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const stopId = formData.get("stopId");

  if (!(file instanceof Blob) || typeof stopId !== "string" || !stopId) {
    return NextResponse.json({ error: "missing file or stopId" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 413 });
  }

  const contentType =
    (file as File).type && (file as File).type.length > 0 ? (file as File).type : "application/octet-stream";
  const origName = typeof (file as File).name === "string" ? (file as File).name : "";
  const extFromName = origName.includes(".")
    ? origName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)
    : "";
  const extFromType = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("heic")
        ? "heic"
        : contentType.includes("pdf")
          ? "pdf"
          : contentType.startsWith("image/")
            ? "jpg"
            : "bin";
  const extension = extFromName || extFromType;
  const filename = `${tripId}/${stopId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const supabase = createSupabaseServerClient();
  const arrayBuffer = await file.arrayBuffer();
  const doUpload = () =>
    supabase.storage.from(photoBucket).upload(filename, arrayBuffer, {
      contentType,
      cacheControl: "3600",
      upsert: false
    });

  let { error: uploadError } = await doUpload();
  // Self-heal: if the storage bucket hasn't been created yet, create it (public) and retry once.
  if (uploadError && /bucket not found/i.test(uploadError.message)) {
    await supabase.storage.createBucket(photoBucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
    ({ error: uploadError } = await doUpload());
  }

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(photoBucket).getPublicUrl(filename);
  return NextResponse.json({ url: publicData.publicUrl, path: filename });
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase storage not configured" },
      { status: 503 }
    );
  }
  const { path } = (await request.json()) as { path?: string };
  if (!path) return NextResponse.json({ error: "missing path" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.storage.from(photoBucket).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

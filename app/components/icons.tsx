import {
  Beer,
  BedDouble,
  Coffee,
  Landmark,
  MapPin,
  Plane,
  ShoppingBag,
  Utensils,
  Wine
} from "lucide-react";
import { type TripCategory } from "@/lib/trip-data";

export function categoryIcon(category: TripCategory, size = 16) {
  const props = { size, strokeWidth: 2.2 };
  switch (category) {
    case "food":
      return <Utensils {...props} />;
    case "coffee":
      return <Coffee {...props} />;
    case "beer":
      return <Beer {...props} />;
    case "whisky":
      return <Wine {...props} />;
    case "sight":
      return <Landmark {...props} />;
    case "shopping":
      return <ShoppingBag {...props} />;
    case "transit":
      return <Plane {...props} />;
    case "hotel":
      return <BedDouble {...props} />;
    default:
      return <MapPin {...props} />;
  }
}

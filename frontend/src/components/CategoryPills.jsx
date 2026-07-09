import { Music, Wrench, Coffee, Image, Briefcase, Heart, Activity, Star } from "lucide-react";

function iconFor(category) {
  switch (category) {
    case "Musique":
      return <Music size={16} className="inline-block mr-2" />;
    case "Atelier":
      return <Wrench size={16} className="inline-block mr-2" />;
    case "Gastronomie":
      return <Coffee size={16} className="inline-block mr-2" />;
    case "Arts":
      return <Image size={16} className="inline-block mr-2" />;
    case "Affaires":
      return <Briefcase size={16} className="inline-block mr-2" />;
    case "Bien-être":
      return <Heart size={16} className="inline-block mr-2" />;
    case "Sports":
      return <Activity size={16} className="inline-block mr-2" />;
    default:
      return <Star size={16} className="inline-block mr-2" />;
  }
}

function CategoryPills({ categories, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`flex items-center text-sm px-3 py-2 rounded-full transition border ${isActive ? "bg-primary/10 text-primary border-primary" : "bg-white text-gray-700 border-gray-100 hover:shadow-sm"}`}
          >
            {iconFor(cat)}
            <span className="truncate">{cat}</span>
          </button>
        );
      })}
    </div>
  );
}

export default CategoryPills;

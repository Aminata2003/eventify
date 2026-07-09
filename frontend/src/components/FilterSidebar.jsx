import { SlidersHorizontal } from "lucide-react";
import { locations } from "../data/mockEvents";

function FilterBar({ filters, setFilters }) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-wrap items-end gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex-1 min-w-[140px]">
        <label htmlFor="date-filter" className="text-xs text-gray-500">Date</label>
        <select
          id="date-filter"
          value={filters.date}
          onChange={(e) => handleChange("date", e.target.value)}
          className="w-full mt-1 text-sm border-b border-gray-200 py-1 outline-none"
        >
          <option value="">N'importe quand</option>
          <option value="today">Aujourd'hui</option>
          <option value="weekend">Ce week-end</option>
        </select>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label htmlFor="location-filter" className="text-xs text-gray-500">Lieu</label>
        <select
          id="location-filter"
          value={filters.location}
          onChange={(e) => handleChange("location", e.target.value)}
          className="w-full mt-1 text-sm border-b border-gray-200 py-1 outline-none"
        >
          {locations.map((loc) => (
            <option key={loc} value={loc === "Sénégal (Tous)" ? "" : loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => setFilters({ date: "", location: "" })}
        className="text-sm text-gray-500 underline hover:text-primary"
      >
        Réinitialiser
      </button>

      
    </div>
  );
}

export default FilterBar;
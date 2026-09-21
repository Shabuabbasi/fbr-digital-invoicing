import { Select } from "../../components/Select";
import { Input } from "../../components/Input";

export interface DateRangeValue {
  range: "today" | "week" | "month" | "custom";
  from: string;
  to: string;
}

export function DateRangeFilter({ value, onChange }: { value: DateRangeValue; onChange: (v: DateRangeValue) => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="w-48">
        <Select
          label="Range"
          value={value.range}
          onChange={(e) => onChange({ ...value, range: e.target.value as DateRangeValue["range"] })}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </Select>
      </div>
      {value.range === "custom" && (
        <>
          <Input label="From" type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} />
          <Input label="To" type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} />
        </>
      )}
    </div>
  );
}

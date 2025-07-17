import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestSelect() {
  const [value, setValue] = useState<string>("");

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="mb-2">Test Select Component</h3>
      <Select value={value} onValueChange={(newValue) => {
        console.log("Test select changed:", newValue);
        setValue(newValue);
      }}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
      <p className="mt-2 text-sm text-gray-600">Current value: {value || "None"}</p>
    </div>
  );
}
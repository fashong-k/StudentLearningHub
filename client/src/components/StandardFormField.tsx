import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect, SimpleSelectItem } from "@/components/ui/simple-select";
import { FormFieldConfig, getStandardFieldProps, handleNumberFieldChange } from "@/lib/formUtils";
import { Control, FieldValues, Path } from "react-hook-form";

interface StandardFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  config: FormFieldConfig;
  onCustomChange?: (value: any, fieldOnChange: (value: any) => void) => void;
  disabled?: boolean;
  className?: string;
}

export function StandardFormField<T extends FieldValues>({
  control,
  name,
  config,
  onCustomChange,
  disabled = false,
  className = "",
}: StandardFormFieldProps<T>) {
  const renderField = (field: any) => {
    const standardProps = getStandardFieldProps(config);
    
    switch (config.type) {
      case 'text':
      case 'email':
        return (
          <Input
            {...standardProps}
            type={config.type}
            disabled={disabled}
            className={className}
            {...field}
          />
        );
        
      case 'number':
        return (
          <Input
            {...standardProps}
            type="number"
            min={config.min}
            max={config.max}
            disabled={disabled}
            className={className}
            value={field.value || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (onCustomChange) {
                onCustomChange(value, field.onChange);
              } else {
                handleNumberFieldChange(value, field.onChange, {
                  allowEmpty: true,
                  min: config.min as number,
                  max: config.max as number,
                });
              }
            }}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            {...standardProps}
            disabled={disabled}
            className={className}
            {...field}
          />
        );
        
      case 'select':
        return (
          <SimpleSelect
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            {config.options?.map((option) => (
              <SimpleSelectItem key={option.value} value={option.value}>
                {option.label}
              </SimpleSelectItem>
            ))}
          </SimpleSelect>
        );
        
      case 'checkbox':
        return (
          <input
            {...standardProps}
            type="checkbox"
            disabled={disabled}
            className={`w-4 h-4 ${className}`}
            checked={field.value}
            onChange={field.onChange}
          />
        );
        
      default:
        return (
          <Input
            {...standardProps}
            type="text"
            disabled={disabled}
            className={className}
            {...field}
          />
        );
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{config.label}</FormLabel>
          <FormControl>
            {renderField(field)}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Example usage component for common form patterns
export function CourseFormFields<T extends FieldValues>({
  control,
  formType = 'create',
}: {
  control: Control<T>;
  formType?: 'create' | 'edit';
}) {
  return (
    <>
      <StandardFormField
        control={control}
        name={'title' as Path<T>}
        config={courseFormFields.title}
      />
      
      <StandardFormField
        control={control}
        name={'courseCode' as Path<T>}
        config={courseFormFields.courseCode}
        disabled={formType === 'edit'} // Course codes cannot be changed after creation
      />
      
      <StandardFormField
        control={control}
        name={'description' as Path<T>}
        config={courseFormFields.description}
      />
      
      <StandardFormField
        control={control}
        name={'year' as Path<T>}
        config={courseFormFields.year}
      />
    </>
  );
}

// Import course form fields for the component
import { courseFormFields } from "@/lib/formUtils";
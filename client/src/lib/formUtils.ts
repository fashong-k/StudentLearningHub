import { z } from "zod";

// Standardized form field configurations
export interface FormFieldConfig {
  id: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  options?: { value: string; label: string }[];
  validation?: z.ZodType<any>;
  autocomplete?: string;
}

// Standardized form field ID generator
export const generateFieldId = (formName: string, fieldName: string): string => {
  return `${formName}-${fieldName}`;
};

// Common validation schemas
export const commonValidations = {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  year: z.number().min(2020, "Year must be 2020 or later").max(2030, "Year must be 2030 or earlier"),
  courseCode: z.string().min(2, "Course code must be at least 2 characters"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  semester: z.enum(["Spring", "Summer", "Fall", "Winter"]),
  termType: z.enum(["semester", "term"]),
  visibility: z.enum(["private", "public", "institution"]),
  gradingScheme: z.enum(["letter", "pass_fail", "percentage"]),
};

// Form field props standardization
export interface StandardFormFieldProps {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

// Generate standard form field props
export const getStandardFieldProps = (config: FormFieldConfig): StandardFormFieldProps => {
  return {
    id: config.id,
    name: config.name,
    placeholder: config.placeholder,
    autoComplete: config.autocomplete,
    required: config.required,
    'aria-describedby': config.required ? `${config.id}-error` : undefined,
    'aria-invalid': false, // This should be dynamically set based on validation state
  };
};

// Number field specific utilities
export const handleNumberFieldChange = (
  value: string,
  fieldOnChange: (value: any) => void,
  options: { allowEmpty?: boolean; min?: number; max?: number } = {}
) => {
  const { allowEmpty = true, min, max } = options;
  
  if (value === '' && allowEmpty) {
    fieldOnChange(undefined);
    return;
  }
  
  const numValue = parseInt(value);
  if (!isNaN(numValue)) {
    // Apply min/max constraints if specified
    if (min !== undefined && numValue < min) return;
    if (max !== undefined && numValue > max) return;
    
    fieldOnChange(numValue);
  }
};

// Course form specific configurations
export const courseFormFields: Record<string, FormFieldConfig> = {
  title: {
    id: generateFieldId('course', 'title'),
    name: 'title',
    type: 'text',
    label: 'Course Title',
    placeholder: 'Introduction to Computer Science',
    required: true,
    validation: commonValidations.title,
    autocomplete: 'off',
  },
  courseCode: {
    id: generateFieldId('course', 'courseCode'),
    name: 'courseCode',
    type: 'text',
    label: 'Course Code',
    placeholder: 'CS 101',
    required: true,
    validation: commonValidations.courseCode,
    autocomplete: 'off',
  },
  description: {
    id: generateFieldId('course', 'description'),
    name: 'description',
    type: 'textarea',
    label: 'Description',
    placeholder: 'Course description...',
    required: false,
    validation: commonValidations.description,
    autocomplete: 'off',
  },
  semester: {
    id: generateFieldId('course', 'semester'),
    name: 'semester',
    type: 'select',
    label: 'Semester',
    required: true,
    validation: commonValidations.semester,
    options: [
      { value: 'Spring', label: 'Spring' },
      { value: 'Summer', label: 'Summer' },
      { value: 'Fall', label: 'Fall' },
      { value: 'Winter', label: 'Winter' },
    ],
  },
  year: {
    id: generateFieldId('course', 'year'),
    name: 'year',
    type: 'number',
    label: 'Year',
    placeholder: '2025',
    required: true,
    min: 2020,
    max: 2030,
    validation: commonValidations.year,
    autocomplete: 'off',
  },
  termType: {
    id: generateFieldId('course', 'termType'),
    name: 'termType',
    type: 'select',
    label: 'Term Type',
    required: true,
    validation: commonValidations.termType,
    options: [
      { value: 'semester', label: 'Semester' },
      { value: 'term', label: 'Term' },
    ],
  },
  visibility: {
    id: generateFieldId('course', 'visibility'),
    name: 'visibility',
    type: 'select',
    label: 'Visibility',
    required: true,
    validation: commonValidations.visibility,
    options: [
      { value: 'private', label: 'Private' },
      { value: 'public', label: 'Public' },
      { value: 'institution', label: 'Institution' },
    ],
  },
  gradingScheme: {
    id: generateFieldId('course', 'gradingScheme'),
    name: 'gradingScheme',
    type: 'select',
    label: 'Grading Scheme',
    required: true,
    validation: commonValidations.gradingScheme,
    options: [
      { value: 'letter', label: 'Letter Grade' },
      { value: 'pass_fail', label: 'Pass/Fail' },
      { value: 'percentage', label: 'Percentage' },
    ],
  },
};
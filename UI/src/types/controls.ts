export type PortDataType =
  | 'prompt_object'
  | 'raw_text'
  | 'tool_payload'
  | 'sanitized_prompt_object'
  | 'redaction_metadata'
  | 'scored_payload'
  | 'tool_manifest'
  | 'filtered_tool_manifest'
  | 'sandbox_result'
  | 'halt_signal'
  | 'alert_signal'
  | 'generic_context'
  | 'cache_hit_payload';

export interface ControlPort {
  id: string;
  label: string;
  type: PortDataType;
}

export interface ControlOption {
  label: string;
  value: string;
}

export interface DynamicRuleCondition {
  portIdentifier: string;
  portLabel: string;
  outputType: PortDataType;
  condition?: Record<string, any>;
}

export type UIFormFieldType =
  | 'text_input'
  | 'number_input'
  | 'multi_select'
  | 'radio_group'
  | 'dropdown'
  | 'slider'
  | 'toggle'
  | 'tag_input'
  | 'dynamic_rule_builder'
  | 'code_editor'
  | 'group';

export interface UIFormField {
  name: string;
  label: string;
  type: UIFormFieldType;
  required?: boolean;
  options?: ControlOption[];
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helperText?: string;
  language?: string;
  fields?: UIFormField[]; // For group type
  rulesSchema?: {
    portIdentifier: string;
    portLabel: string;
    outputType: string;
    conditionJsonLogic?: string;
  };
}

export type UIFormLayout = 'vertical' | 'accordion' | 'grid';

export interface UIForm {
  layout: UIFormLayout;
  fields: UIFormField[];
}

export interface IOValidation {
  allowedInputs: PortDataType[];
  allowedOutputs: PortDataType[];
}

export interface ControlPortsDefinition {
  inputs?: ControlPort[];
  outputs?: ControlPort[];
  dynamicOutputs?: boolean;
}

export interface RuntimeConfig {
  engine: string;
  action: string;
}

export interface ControlCategory {
  id: string;
  label: string;
  icon: string;
  subcategories?: { id: string; label: string }[];
}

export interface ControlDefinition {
  id: string;
  type: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  ioValidation: IOValidation;
  ports: ControlPortsDefinition;
  uiForm: UIForm;
  runtimeConfig: RuntimeConfig;
}

export interface ControlRegistry {
  $schema?: string;
  version: string;
  categories: ControlCategory[];
  controls: ControlDefinition[];
}

import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:navbar";
const additionalProperties = false;
const nullable = true;
const properties = {
  theme: { type: "string", nullable, default: null, description: "Тема" },
  classes: {
    type: "array",
    default: [
      "rounded-box",
      "fixed",
      "top-6",
      "inset-x-6",
      "opacity-0",
      "shadow-xl",
      "transition-opacity",
      "duration-1000",
      "ease-out",
      "hover:opacity-100",
    ],
    items: { type: "string" },
    description: "Классы",
  },
  scrollClasses: {
    type: "array",
    default: ["opacity-100"],
    items: { type: "string" },
    description: "Скролл классы",
  },
  template: {
    description: "Шаблон",
    type: "string",
    default: `<div class="flex-none">
    <label class="btn btn-square btn-ghost" for="drawer">
        <svg class="fill-current h-6 w-6">
            <path :d="mdi.mdiMenu"></path>
        </svg>
    </label>
</div>
<div class="flex-1 truncate">
    <svg class="fill-current h-6 w-6 mx-1">
        <path :d="mdi[\`\${the?.favicon??'mdiWeb'}\`]"></path>
    </svg>
    {{ the?.name }}
</div>
<div v-if="the?.description" class="flex-none">
    <button class="btn btn-square btn-ghost" @click="speak">
        <svg class="fill-current h-6 w-6">
            <path :d="mdi.mdiVolumeHigh"></path>
        </svg>
    </button>
</div>`,
  },
  script: {
    description: "Скрипты",
    type: "string",
    default: `import {
  useSpeechSynthesis,
  useNavigatorLanguage
} from "@vueuse/core";
 const {
  the
} = defineProps(["the"]);
const {
  language: lang
} = useNavigatorLanguage();
const {
  speak
} = useSpeechSynthesis(() => the?.description, {
  lang
});`,
  },
  style: { type: "string", default: "", description: "Стили" },
  setup: { type: "boolean", default: true, description: "" },
  scoped: { type: "boolean", default: true, description: "" },
} as const;
const type = "object";

const Navbar = {
  $id,
  type,
  properties,
  additionalProperties,
} as const satisfies JSONSchema;

export default Navbar;

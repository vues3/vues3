import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:navbar";
const additionalProperties = false;
const nullable = true;
const properties = <const>{
  classes: {
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
    description: "Классы",
    items: { type: "string" },
    type: "array",
  },
  scoped: { default: true, description: "", type: "boolean" },
  script: {
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
    description: "Скрипты",
    type: "string",
  },
  scroll: {
    default: ["opacity-100"],
    description: "Скролл классы",
    items: { type: "string" },
    type: "array",
  },
  setup: { default: true, description: "", type: "boolean" },
  style: { default: "", description: "Стили", type: "string" },
  template: {
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
    description: "Шаблон",
    type: "string",
  },
  theme: { default: null, description: "Тема", nullable, type: "string" },
};
const type = "object";

const Navbar = (<const>{
  $id,
  additionalProperties,
  properties,
  type,
}) satisfies JSONSchema;

export default Navbar;

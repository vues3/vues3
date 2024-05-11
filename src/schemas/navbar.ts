import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:navbar";
const additionalProperties = false;
const properties = {
  scoped: { default: true, description: "", type: "boolean" },
  script: {
    default: `import {
    useSpeechSynthesis,
    useNavigatorLanguage
} from "@vueuse/core";
const props = defineProps(["the", "ready"]);
const {
    language: lang
} = useNavigatorLanguage();
const {
    speak,
    isSupported
} = useSpeechSynthesis(() => props.the.description, {
    lang
});`,
    description: "Скрипты",
    type: "string",
  },
  setup: { default: true, description: "", type: "boolean" },
  style: { default: "", description: "Стили", type: "string" },
  template: {
    default: `<div :class="\`opacity-\${!ready*100}\`" class="flex bg-white pa-2 rounded-2xl fixed top-6 inset-x-6 shadow-xl transition-opacity duration-1000 hover:opacity-100">
  <div class="inline-flex items-center flex-none">
      <label class="flex size-12 items-center justify-center rounded-lg bg-white text-neutral-500 transition-colors hover:bg-neutral-300 hover:text-neutral-600" role="button" for="drawer">
          <svg class="fill-current size-6">
              <path :d="mdi.mdiMenu"></path>
          </svg>
      </label>
  </div>
  <div class="inline-flex items-center flex-1 truncate">
      <svg class="fill-current size-6 mx-1">
          <path :d="mdi[\`\${the.favicon??'mdiWeb'}\`]"></path>
      </svg>
      {{ the?.name }}
  </div>
  <div class="inline-flex items-center flex-none" v-if="isSupported && the?.description">
      <button class="flex size-12 items-center justify-center rounded-lg bg-white text-neutral-500 transition-colors hover:bg-neutral-300 hover:text-neutral-600" @click="speak">
          <svg class="fill-current size-6">
              <path :d="mdi.mdiVolumeHigh"></path>
          </svg>
      </button>
  </div>
</div>`,
    description: "Шаблон",
    type: "string",
  },
} as const;
const type = "object";

const Navbar = {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;

export default Navbar;

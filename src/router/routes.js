const routes = [
  {
    path: "/about",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "About",
        /** @returns {object} - Модуль страницы о программе */
        component: () => import("@/pages/AboutPage.vue"),
      },
    ],
  },
  {
    path: "/content",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Content",
        /** @returns {object} - Модуль страницы контент */
        component: () => import("@/pages/ContentPage.vue"),
      },
    ],
  },
  {
    path: "/navbar",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Navbar",
        /** @returns {object} - Модуль страницы навбара */
        component: () => import("@/pages/NavbarPage.vue"),
      },
    ],
  },
  {
    path: "/css",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Css",
        /** @returns {object} - Модуль страницы каскадных стилей */
        component: () => import("@/pages/CssPage.vue"),
      },
    ],
  },
  {
    path: "/js",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Js",
        /** @returns {object} - Модуль страницы джава скипта */
        component: () => import("@/pages/JsPage.vue"),
      },
    ],
  },
  {
    path: "/settings",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Settings",
        /** @returns {object} - Модуль страницы настроек */
        component: () => import("@/pages/SettingsPage.vue"),
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    /** @returns {object} - Модуль шаблона по умолчанию */
    component: () => import("@/layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        name: "Home",
        /** @returns {object} - Модуль домашней страницы */
        component: () => import("@/pages/HomePage.vue"),
      },
    ],
  },
];

export default routes;

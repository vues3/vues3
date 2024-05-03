export default [
  ...["About", "Content", "Navbar", "Css", "Js", "Settings", "Home"].map(
    (value) => ({
      path: value === "Home" ? "/:catchAll(.*)*" : `/${value.toLowerCase()}`,
      /** @returns - Модуль шаблона по умолчанию */
      component: (): object => import("layouts/MainLayout.vue"),
      children: [
        {
          path: "",
          name: value,
          /** @returns - Модуль страницы о программе */
          component: (): object => import(`pages/${value}Page.vue`),
        },
      ],
    }),
  ),
];

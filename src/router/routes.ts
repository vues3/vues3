export default [
  ...["About", "Content", "Navbar", "Css", "Js", "Settings", "Home"].map(
    (value) => ({
      path: value === "Home" ? "/:catchAll(.*)*" : `/${value.toLowerCase()}`,
      component: (): object => import("layouts/MainLayout.vue"),
      children: [
        {
          path: "",
          name: value,
          component: (): object => import(`pages/${value}Page.vue`),
        },
      ],
    }),
  ),
];

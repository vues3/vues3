export default [
  ...["About", "Content", "Navbar", "Css", "Js", "Settings", "Home"].map(
    (value) => ({
      children: [
        {
          component: (): object => import(`pages/${value}Page.vue`),
          name: value,
          path: "",
        },
      ],
      component: (): object => import("layouts/MainLayout.vue"),
      path: value === "Home" ? "/:catchAll(.*)*" : `/${value.toLowerCase()}`,
    }),
  ),
];

export default [
  {
    children: [
      {
        component: (): object => import("pages/HomePage.vue"),
        name: "Home",
        path: "",
      },
    ],
    component: (): object => import("layouts/MainLayout.vue"),
    path: "/:catchAll(.*)*",
  },
];

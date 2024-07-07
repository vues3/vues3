import mainLayout from "layouts/MainLayout.vue";
import homePage from "pages/HomePage.vue";

export default [
  {
    children: [
      {
        component: homePage,
        name: "Home",
        path: "",
      },
    ],
    component: mainLayout,
    path: "/:catchAll(.*)*",
  },
];

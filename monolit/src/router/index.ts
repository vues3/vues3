import type { RouteRecordRaw, RouterHistory } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";

/**
 * Объект истории
 *
 * @type {RouterHistory}
 */
const history: RouterHistory = createWebHistory(import.meta.env.BASE_URL);

/**
 * Роуты
 *
 * @type {RouteRecordRaw[]}
 */
const routes: RouteRecordRaw[] = [];

export default createRouter({ history, routes });

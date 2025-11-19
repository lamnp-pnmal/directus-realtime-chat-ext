import { defineModule } from "@directus/extensions-sdk";
import ModuleComponent from "./module.vue";

export default defineModule({
  id: "team-chat",
  name: "Team Chat",
  icon: "chat",
  routes: [
    {
      path: "",
      component: ModuleComponent,
    },
  ],
});

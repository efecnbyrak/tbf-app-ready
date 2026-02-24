
import { db } from "./lib/db";

async function check() {
    const settings = await db.systemSetting.findMany();
    console.log("System Settings:", JSON.stringify(settings, null, 2));

    const today = new Date();
    console.log("Current Server Time:", today.toISOString());
    console.log("Current Server Local Time:", today.toString());
}

check();

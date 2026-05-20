const mongoose = require("mongoose");
const dns = require("dns");

const db = async () => {
    const mongoUrl = process.env.MONGO_URL  || process.env.MONGO_URL ;
    try {
        if (mongoUrl && mongoUrl.startsWith("mongodb+srv://")) {
            // Use alternate DNS servers at process level to improve SRV resolution
            // (this avoids requiring users to change system DNS settings).
            dns.setServers(["1.1.1.1", "8.8.8.8"]);
            console.log("Using alternate DNS servers for SRV resolution");
        }

        await mongoose.connect(mongoUrl);
        console.log("Db connected");
    } catch (err) {
        console.log(`Error: ${err.message}`);
        if (err.code === "ECONNREFUSED" && mongoUrl && mongoUrl.startsWith("mongodb+srv://")) {
            console.log(
                "SRV DNS lookup failed. Try using Atlas' standard (non-SRV) connection string or change your system DNS/VPN settings."
            );
        }
        throw err;
    }
};

module.exports = { db};


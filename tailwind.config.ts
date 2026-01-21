import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            borderRadius: {
                xl: "16px",
                "2xl": "20px",
                "3xl": "24px",
            },
        },
    },
    plugins: [],
};

export default config;

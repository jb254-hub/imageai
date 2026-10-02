require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const { InferenceClient } = require("@huggingface/inference");

const app = express();

const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
    console.error("ERROR: HF_TOKEN is missing from .env");
    process.exit(1);
}

const hf = new InferenceClient(HF_TOKEN);

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const generatedDir = path.join(
    __dirname,
    "public",
    "generated"
);

if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, {
        recursive: true
    });
}


app.post("/api/generate-image", async (req, res) => {

    try {

        const {
            prompt,
            width = 1024,
            height = 1024
        } = req.body;

        if (!prompt || typeof prompt !== "string") {

            return res.status(400).json({
                success: false,
                error: "A valid image prompt is required."
            });

        }

        console.log("\n=================================");
        console.log("IMAGE GENERATION REQUEST");
        console.log("=================================");
        console.log("Prompt:", prompt);
        console.log("Model: Qwen/Qwen-Image-2512");
        console.log("Size:", width, "x", height);
        console.log("=================================\n");


        const image = await hf.textToImage({

            model: "Qwen/Qwen-Image-2512",

            inputs: prompt,

            parameters: {
                width: Number(width),
                height: Number(height)
            }

        });


        const buffer = Buffer.from(
            await image.arrayBuffer()
        );


        const filename =
            `qwen-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}.png`;


        const filepath =
            path.join(
                generatedDir,
                filename
            );


        fs.writeFileSync(
            filepath,
            buffer
        );


        const imageUrl =
            `/generated/${filename}`;


        console.log(
            "Image successfully generated:",
            imageUrl
        );


        res.json({

            success: true,

            model: "Qwen/Qwen-Image-2512",

            prompt: prompt,

            image: imageUrl

        });


    } catch (error) {

        console.error(
            "\nIMAGE GENERATION ERROR:"
        );

        console.error(error);


        res.status(500).json({

            success: false,

            error:
                error.message ||
                "Image generation failed."

        });

    }

});


app.get("/api/health", (req, res) => {

    res.json({

        status: "online",

        imageGeneration: true,

        model: "Qwen/Qwen-Image-2512"

    });

});


app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("EXEGESIS IMAGE AI");
    console.log("=================================");
    console.log(
        `Server: http://localhost:${PORT}`
    );
    console.log(
        "Model: Qwen/Qwen-Image-2512"
    );
    console.log(
        "Status: ONLINE"
    );
    console.log("=================================");
    console.log("");

});
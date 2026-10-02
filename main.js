require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const { InferenceClient } = require("@huggingface/inference");

const app = express();

const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
    console.error("Missing HF_TOKEN in .env");
    process.exit(1);
}

const hf = new InferenceClient(HF_TOKEN);

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const generatedDir = path.join(__dirname, "public", "generated");

if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
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
                error: "A prompt is required."
            });
        }

        console.log("Generating image:");
        console.log(prompt);

        const imageBlob = await hf.textToImage({
            model: "black-forest-labs/FLUX.1-schnell",
            inputs: prompt,
            parameters: {
                width,
                height
            }
        });

        const buffer = Buffer.from(await imageBlob.arrayBuffer());

        const filename =
            `image-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}.png`;

        const filepath = path.join(generatedDir, filename);

        fs.writeFileSync(filepath, buffer);

        const imageUrl = `/generated/${filename}`;

        res.json({
            success: true,
            model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            image: imageUrl
        });

    } catch (error) {

        console.error("IMAGE GENERATION ERROR:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message || "Image generation failed."
        });
    }
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        imageGeneration: true,
        model: "black-forest-labs/FLUX.1-schnell"
    });
});

app.listen(PORT, () => {
    console.log("--------------------------------------");
    console.log("Image AI server running");
    console.log(`http://localhost:${PORT}`);
    console.log("--------------------------------------");
});
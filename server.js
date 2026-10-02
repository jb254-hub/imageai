require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const { InferenceClient } = require("@huggingface/inference");

const app = express();

const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;

// Optional:
// Local testing:
// BASE_URL=http://localhost:3000
//
// Render:
// BASE_URL=https://your-service-name.onrender.com
const BASE_URL = process.env.BASE_URL || null;


// ========================================
// VALIDATE ENVIRONMENT
// ========================================

if (!HF_TOKEN) {
    console.error("ERROR: HF_TOKEN is missing.");
    process.exit(1);
}


// ========================================
// HUGGING FACE
// ========================================

const hf = new InferenceClient(HF_TOKEN);


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json({
    limit: "10mb"
}));

app.use(express.static(
    path.join(__dirname, "public")
));


// ========================================
// GENERATED IMAGE DIRECTORY
// ========================================

const generatedDir = path.join(
    __dirname,
    "public",
    "generated"
);

if (!fs.existsSync(generatedDir)) {

    fs.mkdirSync(
        generatedDir,
        {
            recursive: true
        }
    );

}


// ========================================
// IMAGE GENERATION
// ========================================

app.post(
    "/api/generate-image",
    async (req, res) => {

        try {

            const {
                prompt,
                width = 1024,
                height = 1024
            } = req.body;


            // --------------------------------
            // Validate prompt
            // --------------------------------

            if (
                !prompt ||
                typeof prompt !== "string" ||
                !prompt.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "A valid image prompt is required."

                });

            }


            // --------------------------------
            // Validate dimensions
            // --------------------------------

            const imageWidth =
                Number(width);

            const imageHeight =
                Number(height);


            if (
                !Number.isInteger(imageWidth) ||
                !Number.isInteger(imageHeight) ||
                imageWidth < 256 ||
                imageHeight < 256 ||
                imageWidth > 2048 ||
                imageHeight > 2048
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Image dimensions must be between 256 and 2048 pixels."

                });

            }


            console.log("");
            console.log("=================================");
            console.log("EXEGESIS IMAGE GENERATION");
            console.log("=================================");
            console.log("Prompt:", prompt);
            console.log(
                "Model:",
                "Qwen/Qwen-Image-2512"
            );
            console.log(
                "Size:",
                `${imageWidth} x ${imageHeight}`
            );
            console.log("=================================");
            console.log("");


            // --------------------------------
            // Generate image
            // --------------------------------

            const image =
                await hf.textToImage({

                    model:
                        "Qwen/Qwen-Image-2512",

                    inputs:
                        prompt.trim(),

                    parameters: {

                        width:
                            imageWidth,

                        height:
                            imageHeight

                    }

                });


            // --------------------------------
            // Convert image to buffer
            // --------------------------------

            const buffer =
                Buffer.from(
                    await image.arrayBuffer()
                );


            // --------------------------------
            // Generate unique filename
            // --------------------------------

            const filename =
                `qwen-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}.png`;


            const filepath =
                path.join(
                    generatedDir,
                    filename
                );


            // --------------------------------
            // Save image
            // --------------------------------

            fs.writeFileSync(
                filepath,
                buffer
            );


            // --------------------------------
            // Create PUBLIC IMAGE URL
            // --------------------------------

            const baseUrl =
                BASE_URL ||
                `${req.protocol}://${req.get("host")}`;


            const imageUrl =
                `${baseUrl}/generated/${filename}`;


            console.log(
                "Image successfully generated."
            );

            console.log(
                "Image URL:",
                imageUrl
            );


            // --------------------------------
            // Return response
            // --------------------------------

            return res.json({

                success: true,

                model:
                    "Qwen/Qwen-Image-2512",

                prompt:
                    prompt.trim(),

                width:
                    imageWidth,

                height:
                    imageHeight,

                image:
                    imageUrl,

                image_url:
                    imageUrl,

                type:
                    "image"

            });


        } catch (error) {

            console.error("");
            console.error(
                "================================="
            );
            console.error(
                "IMAGE GENERATION ERROR"
            );
            console.error(
                "================================="
            );
            console.error(error);
            console.error("");


            return res.status(500).json({

                success: false,

                error:
                    error.message ||
                    "Image generation failed."

            });

        }

    }
);


// ========================================
// HEALTH CHECK
// ========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status:
                "online",

            imageGeneration:
                true,

            model:
                "Qwen/Qwen-Image-2512",

            service:
                "Exegesis Image AI"

        });

    }
);


// ========================================
// ROOT
// ========================================

app.get(
    "/",
    (req, res) => {

        res.json({

            service:
                "Exegesis Image AI",

            status:
                "online",

            endpoints: {

                health:
                    "/api/health",

                generate:
                    "POST /api/generate-image"

            }

        });

    }
);


// ========================================
// START SERVER
// ========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "       EXEGESIS IMAGE AI"
        );
        console.log(
            "================================="
        );
        console.log(
            `Port: ${PORT}`
        );
        console.log(
            "Model: Qwen/Qwen-Image-2512"
        );
        console.log(
            "Status: ONLINE"
        );
        console.log(
            "================================="
        );
        console.log("");

    }
);
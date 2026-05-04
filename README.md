# 🎨 Financial Data Generative Art

An interactive 2D generative art platform that transforms financial market trends into stunning, abstract visual masterpieces. Built with **p5.js** for high-performance rendering and **Python** for data synthesis.

## ✨ Features

-   **7 Unique Art Modes**:
    -   **Mode A (Op Art Geometry)**: Radiating geometry mapped to RSI/MACD.
    -   **Mode B (Fluid Particles)**: Flow field based on EMA slopes.
    -   **Mode C (Fractal Mandala)**: Radially symmetric structures reflecting volatility.
    -   **Mode D (Op Art Interference)**: Bridget Riley-inspired vertical wavy lines with breathing animation.
    -   **Mode E (Action Painting)**: Pollock-style paint splatters on a textured canvas.
    -   **Mode F (Color Field)**: Rothko-style atmospheric color blocks reflecting market sentiment.
    -   **Mode G (Digital Impressionism)**: Van Gogh-style textured brush strokes following price flow.
-   **Live Data Interaction**: Hover over art to see historical price, RSI, and MACD indicators.
-   **Categorized Fuzzy Search**: Quickly find assets across Crypto, US Stocks, HK Stocks, Indices, and more.
-   **Personal Gallery**: Automatic history sidebar with thumbnails of your generated works.
-   **Social Sharing**: Encode your favorite combinations into shareable URLs.
-   **Immersive Experience**: Fullscreen mode and collapsible UI panels for distraction-free viewing.

## 🚀 Getting Started

### Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/octahedronbb/financial-art-gen.git
    cd financial-art-gen
    ```

2.  **Generate/Update Data**:
    Requires Python 3.
    ```bash
    python fetch_data.py
    ```

3.  **Launch the App**:
    Simply open `index.html` in your favorite browser, or use a local server:
    ```bash
    # If you have Python installed
    python -m http.server 8000
    ```

## 🤖 Automated Updates

This project uses **GitHub Actions** to automatically refresh market data every day at midnight. The workflow runs `fetch_data.py` and commits the updated `data.js` directly to the repository, ensuring your art is always based on the latest trends.

## 🛠️ Tech Stack

-   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
-   **Rendering**: [p5.js](https://p5js.org/)
-   **Data Processing**: Python 3
-   **Deployment**: GitHub Pages & Actions

## 📜 License

MIT License. Feel free to use and modify for your own artistic exploration!

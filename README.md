# AI CV Formatter

## Overview
The AI CV Formatter is a Next.js application designed to streamline the process of formatting and analyzing CVs (Curriculum Vitae) using artificial intelligence. It provides tools for extracting text from DOCX files, replacing content, and potentially analyzing CV data against predefined schemas.

## Features
- **DOCX Processing:** Extract text and replace content within `.docx` files.
- **AI Integration:** Leverage AI for advanced CV analysis and formatting.
- **Modern UI:** Built with Next.js and a component library for a responsive and intuitive user experience.

## Deployment
This project is deployed to GitHub Pages. You can access the live application at:
[https://musakavak.github.io/ai-cv-formatter](https://musakavak.github.io/ai-cv-formatter)

## Technologies Used
- Next.js
- React
- TypeScript
- Tailwind CSS (inferred from `postcss.config.mjs` and common Next.js setups)
- Shadcn UI (inferred from `src/components/ui/shadcn-io`)

## Getting Started

### Prerequisites
Make sure you have Node.js (LTS version) and npm or yarn installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/musakavak/ai-cv-formatter.git
   cd ai-cv-formatter
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Development Server
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production
```bash
npm run build
# or
yarn build
```
This will create a `build` directory with the production-ready application.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
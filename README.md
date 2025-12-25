# OctoLens

A modern, responsive web application built with React and Vite that allows users to view and manage photos from GitHub repositories. This project uses [shadcn-ui](https://ui.shadcn.com/) for a premium, accessible user interface.

## Features

- **GitHub Authentication**: Secure login via GitHub OAuth.
- **Dashboard**: View your repositories and profile information.
- **Repository View**: Browse images within specific repositories.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Dark Mode Support**: Built-in support for light and dark themes.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn-ui](https://ui.shadcn.com/)
- **State Management**: React Context + TanStack Query (React Query)
- **Routing**: React Router DOM

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (or yarn/bun)
- A GitHub OAuth App (Client ID required)

## Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:yubi-builds/github-photo-gallery.git
   cd github-photo-gallery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configuration**
   Open `src/contexts/AuthContext.tsx` and replace `YOUR_GITHUB_CLIENT_ID` with your actual GitHub OAuth Client ID.
   
   > **Note**: For a production app, it is highly recommended to move this to an environment variable (e.g., `VITE_GITHUB_CLIENT_ID` in a `.env` file).

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory. You can preview the build locally using:

```bash
npm run preview
```

## Docker

This project includes a Dockerfile for containerized deployment using Nginx.

### Build and Run with Docker

1. **Build the image**
   ```bash
   docker build -t github-photo-gallery .
   ```

2. **Run the container**
   ```bash
   docker run -p 8080:80 github-photo-gallery
   ```
   Access the app at `http://localhost:8080`.

## License

[MIT](LICENSE) (Suggested - please verify)

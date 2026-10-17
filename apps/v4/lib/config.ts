export const siteConfig = {
  name: "Form & Field",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000",
  ogImage: "https://ui.shadcn.com/og.jpg",
  description:
    "Composable, accessible components with thoughtful defaults. Build your own component library with code you can customize, extend, and make your own.",
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/rafael-alani/ff",
  },
  navItems: [
    {
      href: "/",
      label: "Home",
    },
    {
      href: "/docs/installation",
      label: "Docs",
    },
    {
      href: "/docs/components",
      label: "Components",
    },
    {
      href: "/blocks",
      label: "Blocks",
    },
    {
      href: "/charts/area",
      label: "Charts",
    },
    {
      href: "/docs/directory",
      label: "Directory",
    },
    {
      href: "/typeset",
      label: "Typeset",
    },
    {
      href: "/create",
      label: "Create",
    },
  ],
}

export const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
}

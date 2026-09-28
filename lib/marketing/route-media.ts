import type { featureNavigation, useCaseNavigation } from "@/lib/marketing/navigation"

export type RouteMediaAsset = {
  src: string
  mobileSrc: string
  width: number
  height: number
}

export const featureMedia = {
  automaticClips: {
    src: "/media/routes/automaticClips-1280.avif",
    mobileSrc: "/media/routes/automaticClips-640.avif",
    width: 1536,
    height: 1024,
  },
  subtitleEditor: {
    src: "/media/routes/subtitleEditor-1280.avif",
    mobileSrc: "/media/routes/subtitleEditor-640.avif",
    width: 1536,
    height: 2752,
  },
  verticalExport: {
    src: "/media/routes/verticalExport-1280.avif",
    mobileSrc: "/media/routes/verticalExport-640.avif",
    width: 2752,
    height: 1536,
  },
  brandTemplates: {
    src: "/media/routes/brandTemplates-1280.avif",
    mobileSrc: "/media/routes/brandTemplates-640.avif",
    width: 1536,
    height: 1024,
  },
  latamAi: {
    src: "/media/routes/latamAi-1280.avif",
    mobileSrc: "/media/routes/latamAi-640.avif",
    width: 2752,
    height: 1536,
  },
  batchExport: {
    src: "/media/routes/batchExport-1280.avif",
    mobileSrc: "/media/routes/batchExport-640.avif",
    width: 2752,
    height: 1536,
  },
  projectManagement: {
    src: "/media/routes/projectManagement-1280.avif",
    mobileSrc: "/media/routes/projectManagement-640.avif",
    width: 1536,
    height: 1024,
  },
} satisfies Record<(typeof featureNavigation)[number]["id"], RouteMediaAsset>

export const useCaseMedia = {
  cliperos: {
    src: "/media/routes/cliperos-1280.avif",
    mobileSrc: "/media/routes/cliperos-640.avif",
    width: 2400,
    height: 1792,
  },
  streamers: {
    src: "/media/routes/streamers-1280.avif",
    mobileSrc: "/media/routes/streamers-640.avif",
    width: 2752,
    height: 1536,
  },
  podcasters: {
    src: "/media/routes/podcasters-1280.avif",
    mobileSrc: "/media/routes/podcasters-640.avif",
    width: 2400,
    height: 1792,
  },
  coaches: {
    src: "/media/routes/coaches-1280.avif",
    mobileSrc: "/media/routes/coaches-640.avif",
    width: 2400,
    height: 1792,
  },
  creators: {
    src: "/media/routes/creators-1280.avif",
    mobileSrc: "/media/routes/creators-640.avif",
    width: 2400,
    height: 1792,
  },
  communities: {
    src: "/media/routes/communities-1280.avif",
    mobileSrc: "/media/routes/communities-640.avif",
    width: 2752,
    height: 1536,
  },
  agencies: {
    src: "/media/routes/agencies-1280.avif",
    mobileSrc: "/media/routes/agencies-640.avif",
    width: 2752,
    height: 1536,
  },
  brands: {
    src: "/media/routes/brands-1280.avif",
    mobileSrc: "/media/routes/brands-640.avif",
    width: 2752,
    height: 1536,
  },
} satisfies Record<(typeof useCaseNavigation)[number]["id"], RouteMediaAsset>

export function Mirrored({ paths }: { paths: string[] }) {
  return paths.map((d) => [
    <path key={d} d={d} />,
    <path key={`${d}-m`} d={d} transform="matrix(-1 0 0 1 200 0)" />,
  ])
}

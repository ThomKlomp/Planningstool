import ScheduleMock from "@/components/schedule-mock";
import { themeStyle } from "@/lib/home-themes";

/** De laptop uit de hero: gaat langzaam open, daarna gaat het scherm aan met
 *  het klikbare rooster erin. Gedeeld door alle homepage-ontwerpen. */
export default function HeroLaptop({ vars = {} }: { vars?: Record<string, string> }) {
  return (
    <div
      className="mx-auto w-full max-w-sm [container-type:inline-size]"
      style={themeStyle(vars)}
    >
        {/* Laptop: staat dicht en gaat langzaam open (deksel draait om het
            scharnier), daarna gaat het scherm aan met het rooster erin. */}
        <div className="hero-lid relative z-10 rounded-t-2xl rounded-b-md border-[6px] border-ink bg-ink p-2 shadow-xl">
          <div className="hero-screen-on overflow-hidden rounded-lg bg-paper p-1.5">
            <ScheduleMock />
          </div>
        </div>
        {/* Onderstel: even diep als het deksel hoog is (0,84 x de breedte) en
            schuin naar achteren gekanteld (rotateX), zodat je het van boven
            ziet en het echt op een laptop lijkt. perspective() zit in de
            transform en is gelijk aan die van het deksel, zodat een dicht
            deksel precies op het toetsenbord past. */}
        <div className="relative aspect-[100/21] w-full">
          <div
            className="absolute inset-x-0 top-0 aspect-[100/84] origin-top bg-[#2d2d29]"
            style={{ transform: "perspective(833.33cqw) rotateX(77deg)" }}
          >
            <div className="absolute inset-x-0 top-0 h-[2%] bg-black/50" />
            <div
              className="absolute inset-x-[5%] top-[5%] h-[55%] rounded-sm"
              style={{
                backgroundColor: "#3d3d38",
                backgroundImage:
                  "linear-gradient(90deg, #232320 3px, transparent 3px), linear-gradient(0deg, #232320 7px, transparent 7px)",
                backgroundSize: "7.1428% 100%, 100% 16.6667%",
              }}
            />
            <div className="absolute bottom-[8%] left-1/2 h-[26%] w-[36%] -translate-x-1/2 rounded-md border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
        <div className="relative left-1/2 -mt-px h-[8px] w-[110.9%] -translate-x-1/2 rounded-b-lg bg-gradient-to-b from-[#2d2d29] to-ink">
          <div className="absolute left-1/2 top-0 h-[3px] w-[16%] -translate-x-1/2 rounded-b-md bg-black/50" />
        </div>
        <div className="mx-auto mt-3 h-4 w-[96%] rounded-[50%] bg-ink/10 blur-md" />
    </div>
  );
}

import About from "@/components/About";
import Hero from "@/components/Hero";
import Arrowroot from "@/components/arrowroot.jsx";
import Products from "@/components/Products";
import BrandStory from "@/components/BrandStory"
import Videos from "@/components/Videos";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";


export default function Home() {
  return (
    <>
      <Hero />
      <Arrowroot />
      <Products />
      <About/>
      <BrandStory/>
      <Videos/>
      <Contact />
      <Footer />
    </>
  );
}

import About from "@/components/About";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Videos from "@/components/Videos";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";


export default function Home() {
  return (
    <>
      <Hero />
      <Products />
      <About/>
      <Videos/>
      <Contact />
      <Footer />
    </>
  );
}

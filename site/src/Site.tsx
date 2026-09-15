import { cx } from "@/utils/cx"
import styles from "./Site.module.scss"
import { Cta } from "./sections/Cta"
import { Faq } from "./sections/Faq"
import { Features } from "./sections/Features"
import { Footer } from "./sections/Footer"
import { Header } from "./sections/Header"
import { Hero } from "./sections/Hero"
import { HowItWorks } from "./sections/HowItWorks"
import { Mock } from "./sections/Mock"

export function Site() {
  return (
    <div className={styles.page} id="top">
      <div className={styles.glow} />
      <Header />
      <Hero />

      <div className={cx(styles.wrap, styles.mid, styles.mockSection)}>
        <Mock />
      </div>

      <section className={cx(styles.wrap, styles.section)} id="how">
        <HowItWorks />
      </section>

      <section className={cx(styles.wrap, styles.section)} id="features">
        <Features />
      </section>

      <section className={cx(styles.wrap, styles.narrow, styles.section)} id="faq">
        <Faq />
      </section>

      <section className={cx(styles.wrap, styles.section)}>
        <Cta />
      </section>

      <Footer />
    </div>
  )
}

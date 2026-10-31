import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ArrowLeft } from '@/components/icons';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Pratirodh.com: Putting People First. Independent news, views and analysis, and a space for alternative voices.',
  alternates: { canonical: '/about-us/' },
};

export default function AboutUs() {
  return <><Header/><main id="main" className="article-page about-page">
    <Link href="/" className="back-link"><ArrowLeft size={16}/> Back to your brief</Link>
    <div className="article-eyebrow">INDEPENDENT VOICES · ESSENTIAL STORIES</div>
    <h1>About Us</h1>
    <div className="article-body">
      <section aria-labelledby="about-english" lang="en">
        <h2 id="about-english">Pratirodh.com : Putting People First.</h2>
        <p>Pratirodh is an independent expression of Alternative Media. It stands for critical truth and objectivity, the politics and culture of resistance, the reportage and analysis of the bitter realism of our times. A resistance has been born in the face of totalitarian market fundamentalism, the complete corporate takeover of reportage, ideas, opinion and documentation, an unstoppable monopolization of expression and one-dimensional onslaught on the freedom to write, think, speak, feel, see, hear. When all options of free expression are blocked, resistance is born: Pratirodh.</p>
        <p>With the onset of the 21st century, the overdose of information and communication has subsumed virtually everything. This infotainment ‘revolution’ has imposed only those values and information which serves its purpose. There is barely any space for other dimensions of reality. It seems there is no space for an alternative viewpoint, a different version, a second opinion, the idea of creative dissent. All unsuitable points of view are being blocked out deliberately, systematically, relentlessly. Crushed.</p>
        <p>In such a scenario, to resist this totalitarian monopolisation of views and voices, a new symbolism, idiom, template, texture, text, is required. It is also our responsibility to walk the first steps towards this independent rainbow coalition of hope and freedom. Pratirodh is trying to do just that.</p>
        <p>It is a small beginning. Small is beautiful. Help us become more beautiful. Help us make the resistance luminescent. Help us write, report, think, speak, see, hear, a different language of realism and truth. Give us your feedback, critical notes, notes of dissent and criticism, words of praise.</p>
        <p>Pratirodh is the foundation of an Alternative Media. It is an attempt to find space beyond the gigantic corporate media hegemony. A search for independent, authentic, meaningful, mainstream journalism.</p>
        <p>This is a medium to bring news from India and abroad to ordinary people. Our expanse will be within and beyond politics, economy and society, people’s struggles and movements, sports and entertainment, arts and literature, theatre and cinema, media and multi-media. It is our commitment to bring you original information and insights, processed and raw, that either the corporate media is not showing or doesn’t want to show. This will be our own ‘exclusive’ breaking news: free, fearless, frank.</p>
        <p>Pratirodh.com is a news, views and analysis based website.</p>
      </section>
      <section aria-labelledby="about-hindi" lang="hi" className="about-hindi">
        <h2 id="about-hindi">प्रतिरोध डॉट कॉमः हमारे बारे में-</h2>
        <p>प्रतिरोध का जन्म तब होता है जब कुछ चीज़ें निरंतर आरोधित हो रही हों और उनके सामने कुछ और न टिकने, कहने दिया जाए. मीडिया की मंडी में 21वीं सदी में प्रवेश के साथ ही एक बाढ़ की तरह सूचना और संप्रेषण का संसार बढ़ता गया. इस बाढ़ ने सिर्फ अपनी चीज़ें थोपी हैं और अपनी बातें ही बताई हैं. किसी और से कुछ और सुनने-कहने के लिए नहीं छोड़ा गया. बल्कि एक षड़यंत्र के तहत तमाम छोटी-बड़ी आवाज़ों को खामोश करने का काम ही किया गया. ऐसे में, इस अंधी और एकतरफा हो चली मीडिया मंडी में प्रतिरोध को खड़ा करना ज़रूरत भी है और ज़िम्मेदारी भी.</p>
        <p>प्रतिरोध डॉट कॉम के ज़रिए इसी ज़रूरत और ज़िम्मेदारी को अंजाम देने की कोशिश की जा रही है. एक बहुत छोटा-सा प्रयास है जिसे आप लोगों के सुझाव, सहयोग और सहायता से मज़बूत करने का काम किया जाएगा. प्रतिरोध को लाना एक वैकल्पिक माध्यम को खड़ा करना है. प्रतिरोध को लाना संचार माध्यमों की सुनियोजित तैयारियों के बीच अपनी जगह खोजना है. प्रतिरोध को लाना उन सब बातों को कहने का मंच तैयार करना है जिन्हें हम कहना चाहते हैं, ज़रूरी समझते हैं पर कहने नहीं दिया जा रहा है.</p>
        <p>प्रतिरोध डॉट कॉम देश और दुनिया की कई अहम खबरों को आमजन तक पहुंचाने का एक माध्यम है. प्रतिरोध डॉट कॉम के ज़रिए हम राष्ट्रीय, अंतरराष्ट्रीय, सामाजिक-राजनीतिक आंदोलनों, राजनीति और विचारधारा, अर्थ जगत, खेल, मनोरंजन, कला और साहित्य, रंगमंच और सिनेमा, मीडिया और अन्य कई महत्वपूर्ण पहलुओं की ख़ास ख़बरें आपतक लेकर आते हैं. हमारा प्रयास है कि हम ऐसी सामग्री आपतक पहुंचाएं जिसे अधिकतर जनमाध्यम या तो दिखा नहीं रहे और या फिर दिखाना नहीं चाहते. हमारा प्रयास है कि लगातार आपके समक्ष ऐसी एक्सक्लूसिव और निर्भीक जानकारी पहुंचती रहे.</p>
      </section>
    </div>
  </main></>;
}

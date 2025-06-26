import React, { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'terms' | 'privacy';
}

const LegalPopupModal = ({ isOpen, onClose, title, type }: Props) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const renderTermsContent = () => (
    <div className="space-y-6 text-gray-300 leading-relaxed">
      <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <strong>Last Updated:</strong> Feb 12, 2025, 12:00 AM
      </div>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">1. PREAMBLE</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>1.1</strong> NOCENA is a Web3 SocialFi application (hereinafter as the "Platform") launched and
            operated by NOCENA LLC (hereinafter as the "Company" or "we"). Users of the Platform are able to earn tokens
            by completing challenges issued by other users or the Platform itself.
          </p>
          <p>
            <strong>1.2</strong> The use of the Platform and the related services, available within or in connection
            with the Platform (hereinafter as the "Services"), is subject to the following terms and conditions
            (hereinafter as the "T&Cs"). By accessing and using the Platform and related Services, you are agreeing to
            the T&Cs, as amended and in eRect at the time of use. You agree to regularly check the T&Cs to take notice
            of any changes that may have been made.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">2. THE PLATFORM</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>2.1</strong> Access to the Platform is provided on a temporary basis, and we reserve the right to
            modify or withdraw the Services at any time without prior notice. We shall not be held liable for any
            unavailability of the Platform, regardless of the duration or reason. Additionally, we may, at our
            discretion, restrict access to certain parts or the entirety of the Platform.
          </p>
          <p>
            <strong>2.2</strong> The Company reserves the right, at its sole discretion and without prior notice, to
            modify, suspend, remove, or alter the Services or any part of the Platform at any time Platform.
          </p>
          <p>
            <strong>2.3</strong> The Platform shall be provided "as is", we make no warranties that:
          </p>
          <p>
            <strong>2.3.1</strong> The Platform will operate continuously and will be free from technical errors;
          </p>
          <p>
            <strong>2.3.2</strong> The Platform will meet all your expectations or requirements.
          </p>
          <p>
            <strong>2.4</strong> The user will be able to earn Nocenix tokens emitted by the Company (hereinafter as the
            "Tokens") within the Platform by completing tasks periodically assigned by the Platform (hereinafter as the
            "Challenges") or other users (hereinafter as the "Private Challenges").
          </p>
          <p>
            <strong>2.5</strong> The Challenges shall be categorized as daily, weekly, or monthly, with the amount of
            Tokens awarded being proportionate to the complexity and diRiculty of the respective task. Under no
            circumstances shall users be obligated to complete any task, nor shall they incur any penalties or adverse
            consequences for failing to do so. All Challenges are entirely voluntary, and their completion is solely at
            the discretion of the users.
          </p>
          <p>
            <strong>2.6</strong> A user completes a Challenge or Private Challenge by uploading a photo or video to the
            Platform demonstrating the successful completion of the task. Upon completion, the user may be eligible to
            receive Tokens.
          </p>
          <p>
            <strong>2.7</strong> Whether a Challenge or Private Challenge is deemed successfully completed is determined
            by a voting process involving other users. A Challenge or Private Challenge will be considered completed if
            it receives the required number of votes, as determined by the Platform's internal algorithm. The
            configuration of this algorithm is confidential, and the Company reserves the right to modify it at any
            time. The determination of whether a Challenge or Private Challenge has been successfully completed may also
            be subject to evaluation by an artificial intelligence system (hereinafter as the "AI"). The user expressly
            consents to the use of AI for this purpose.
          </p>
          <p>
            <strong>2.8</strong> The user acknowledges that the completion of a Challenge does not create any legal
            entitlement to receive Tokens, and the Company is under no obligation to award Tokens.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">3. TOKENS</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>3.1</strong> Upon the creation of a user account, each user will be assigned a digital wallet
            intended for the accumulation of Tokens.
          </p>
          <p>
            <strong>3.2</strong> The user will receive all necessary access credentials and shall be responsible for
            carefully safeguarding, protecting, and ensuring that no third party gains access to them. The Company shall
            not be liable for any damage or loss arising from the breach of this obligation or misuse of user's digital
            wallet.
          </p>
          <p>
            <strong>3.3</strong> The Company solely facilitates the creation of the digital wallet, but the legal
            relationship is established exclusively between the user and the digital wallet provider. The Company is not
            a party to this relationship.
          </p>
          <p>
            <strong>3.4</strong> We may from change the rate at which users accumulate tokens using the Platform,
            particularly in response to changes in their value due to market conditions, other relevant factors, or at
            our sole discretion.
          </p>
          <p>
            <strong>3.5</strong> We make no representations or warranties regarding the Tokens accumulated through the
            Platform or Services, including any guarantee of specific value or monetary worth. You bear full
            responsibility for any loss or decrease in the value of the Tokens.
          </p>
          <p>
            <strong>3.6</strong> If the receipt of Tokens triggers any tax or fee obligations under the laws applicable
            in your jurisdiction, it is your sole responsibility to fulfill such obligations in compliance with the law.
            The Company shall not be held liable in any manner for your failure to meet these tax obligations.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">4. USER</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>4.1</strong> You must be at least 18 years old, or the age of legal majority in your jurisdiction of
            residence, to access and use the Platform and the Services.
          </p>
          <p>
            <strong>4.2</strong> The Platform and Services are provided solely for personal, non-commercial use. When
            engaging with the Platform or Services, users are expected to exercise caution and sound judgment to
            safeguard their personal safety and well-being. You acknowledge and agree that the Company shall not be held
            responsible or liable for any loss, damage, injury, death, or other harm of any nature arising from your use
            of the Platform or Services, including but not limited to any harm resulting from participation in or
            completion of Challenges or Private Challenges.
          </p>
          <p>
            <strong>4.3</strong> By using the Platform or the Services you represent and warrant that:
          </p>
          <p>
            <strong>4.3.1</strong> You are not a current resident of Costa Rica,
          </p>
          <p>
            <strong>4.3.2</strong> Your access to and use of the Platform and Services is lawful in the jurisdiction
            where you access and use the Platform and Services in the manner in which you access and use them, and
          </p>
          <p>
            <strong>4.3.3</strong> You have full legal, moral, and mental capacity to use the Platform in a manner that
            is both safe and lawful.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">5. PRIVACY</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>5.1</strong> Our privacy policy, detailing the manner in which we collect, store, use, and disclose
            your personal information, is available at https://www.nocena.com/privacy-policy (hereinafter referred to as
            the "Privacy Policy"). By accessing and using the Platform, you acknowledge and consent to the processing of
            your personal information in accordance with the Privacy Policy and warrant that all information you provide
            is accurate and up to date.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">6. INTELECTUAL PROPERTY</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>6.1</strong> The intellectual property rights in all software, content, and materials (including
            images) made available through the Platform or Services are owned by the Company or its licensors and are
            protected by applicable copyright laws and international treaties. All such rights are fully reserved by the
            Company and its licensors.
          </p>
          <p>
            <strong>6.2</strong> You are permitted to store, print, and display the content provided solely for
            personal, non-commercial use. You may not publish, modify, distribute, or reproduce any content or copies
            thereof in any format, whether obtained through the Platform or Services, nor may you use such content for
            any business or commercial purposes.
          </p>
          <p>
            <strong>6.3</strong> We do not claim ownership of the content uploaded by you to the Platform, but you grant
            the Company a non-exclusive, irrevocable, worldwide license, including the right to sublicense to third
            parties, to use, reproduce, distribute, and otherwise exercise intellectual property rights in the submitted
            content for any purpose, including submitting the content to AI.
          </p>
          <p>
            <strong>6.4</strong> The license granted to the Company under Article 6.3 of these T&Cs is provided on a
            royalty-free basis, and you acknowledge that you are not entitled to any compensation for any commercial use
            of the content you upload to the Platform.
          </p>
          <p>
            <strong>6.5</strong> We assume, and you hereby warrant, that you possess all necessary rights to any content
            you upload to the Platform, allowing you to use and manage such content in this specific manner.
          </p>
          <p>
            <strong>6.6</strong> You acknowledge that any content you upload to the Platform becomes public and may be
            accessed by anyone through the Platform.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">7. PURCHASE</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>7.1</strong> The Company may oRer products and Services, including Tokens, for purchase through the
            Apple App Store, Google Play, or other authorized external platforms (hereinafter as the "External
            Service"), with any purchases made being an external service purchase.
          </p>
          <p>
            <strong>7.2</strong> When making a purchase through the Service, you may have the option to pay via an
            External Service, such as your Apple ID or Google Play account (hereinafter as the "External Account"). The
            charges for the purchase will be applied to your External Account in accordance with the terms provided at
            the time of purchase, as well as the general terms governing your External Account and those specified by
            the External Service. Depending on your place of residence, applicable taxes and fees may be added to the
            purchase, and such rates are subject to change over time.
          </p>
          <p>
            <strong>7.3</strong> All purchases made are final and non-refundable.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">8. DISCLAIMER OF REPRESENTATIONS AND WARRANTIES</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>8.1</strong> To the maximum extent permitted by law, the company disclaims all express or implied
            representations and warranties regarding the Platform or Services, including but not limited to their
            accuracy, completeness, suitability, or fitness for any particular purpose.
          </p>
          <p>
            <strong>8.2</strong> The user expressly acknowledges that the Company may, at any time and for any reason,
            or without any reason, partially or fully terminate the Platform or Services.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">9. PROHIBITIONS</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>9.1</strong> You are prohibited from misusing the Platform or the Services. This includes, but is
            not limited to, the following actions:
          </p>
          <p>
            <strong>9.1.1</strong> Engaging in or promoting any criminal activity.
          </p>
          <p>
            <strong>9.1.2</strong> Transmitting or distributing any malicious or harmful software, such as viruses,
            trojans, worms, logic bombs, or any material that is offensive, obscene, or breaches confidentiality.
          </p>
          <p>
            <strong>9.1.3</strong> Gaining unauthorized access to any part of the Platform or Services, corrupting data,
            or causing disruption or annoyance to other users.
          </p>
          <p>
            <strong>9.1.4</strong> Violating the proprietary rights of any individual or entity.
          </p>
          <p>
            <strong>9.1.5</strong> Impersonating another person or stating false personal information.
          </p>
          <p>
            <strong>9.1.6</strong> Publishing unsolicited advertisements or promotional materials, commonly known as
            "spam."
          </p>
          <p>
            <strong>9.1.7</strong> Attempting to impair the performance or functionality of any computer systems
            connected to or accessed through the Platform or Services.
          </p>
          <p>
            <strong>9.1.8</strong> Using emulators or third-party software to cheat or gain unfair advantages within the
            Platform or Services.
          </p>
          <p>
            <strong>9.1.9</strong> Making false, misleading, or deceptive statements or representations.
          </p>
          <p>
            <strong>9.1.10</strong> Engaging in fraudulent activities, abuse, or any misuse of the Platform or Services.
          </p>
          <p>
            <strong>9.1.11</strong> Submitting any content that violates applicable laws.
          </p>
          <p>
            <strong>9.1.12</strong> Infringing upon the intellectual property, privacy, or confidentiality rights of
            others, including copyrights, patents, or trademarks.
          </p>
          <p>
            <strong>9.1.13</strong> Violating any applicable local, national, or international laws or regulations.
          </p>
          <p>
            <strong>9.1.14</strong> Engaging in defamatory or libelous behavior towards any person.
          </p>
          <p>
            <strong>9.1.15</strong> Threatening, intimidating, or harassing others.
          </p>
          <p>
            <strong>9.1.16</strong> Publishing or sharing content that, in the Company's discretion, is inappropriate,
            obscene, or unsuitable for the Platform.
          </p>
          <p>
            <strong>9.1.17</strong> Posting or distributing malicious code, scripts, or data that may harm, interfere
            with, or modify the Platform or Services without the Company's prior written consent.
          </p>
          <p>
            <strong>9.1.18</strong> Engaging in any activity or behavior that contradicts the intended purpose or spirit
            of the Platform or Services, as determined by the Company in its sole discretion.
          </p>

          <p>
            <strong>9.2</strong> To maintain a safe, respectful, and lawful environment on our Platform, users are
            strictly prohibited from engaging in or promoting the following topics or activities when assigning Private
            Challenges to other users or completing Private Challenges assigned by other users. Prohibited Private
            Challenges categories include but are not limited to, the following actions:
          </p>

          <p>
            <strong>9.2.1 Illegal Activities</strong>
          </p>
          <p>
            Private Challenges must not involve or promote any activities deemed illegal under any applicable
            legislation, especially criminal activities, including but not limited to:
          </p>
          <p>
            <strong>a.</strong> Violence or physical harm: Promoting or encouraging assaults, physical violence, or harm
            against individuals or groups.
          </p>
          <p>
            <strong>b.</strong> Theft, fraud, or embezzlement: Any act of unlawfully obtaining money, goods, or services
            through deception or illegal means.
          </p>
          <p>
            <strong>c.</strong> Sexual exploitation, non-consensual acts or harassment: Acts that involve or encourage
            unwanted or inappropriate sexual advances, requests, or behavior, rape or coercion and abuse.
          </p>
          <p>
            <strong>d.</strong> Use of restricted equipment: Promoting or encouraging activities involving illegal or
            controlled equipment, devices, or radioactive substances and isotopes.
          </p>
          <p>
            <strong>e.</strong> Bribery and corruption: Promoting or facilitating bribery or any related corrupt
            practices.
          </p>
          <p>
            <strong>f.</strong> Violation of laws: Engaging in or encouraging actions that may directly or indirectly
            lead to a breach of any applicable legal provisions.
          </p>
          <p>
            <strong>g.</strong> Human trafficking or exploitation: Promoting or participating in any form of human
            trafficking or exploitation, including forced labor or illegal services.
          </p>
          <p>
            <strong>h.</strong> Money laundering: Engaging in or facilitating the process of concealing the origins of
            illegally obtained money.
          </p>
          <p>
            <strong>i.</strong> Harmful services: Promoting or offering services that are potentially dangerous and
            could cause harm to the health or safety of users or third parties.
          </p>
          <p>
            <strong>j.</strong> Violations of rights: Activities that infringe on the rights and legitimate interests of
            citizens, organizations, or violate any applicable legal requirements.
          </p>

          <p>
            <strong>9.2.2 Violence and Cruelty</strong>
          </p>
          <p>Private Challenges must not involve or promote any of the following:</p>
          <p>
            <strong>a.</strong> Activities or content containing threats, insults, defamation, or any actions
            discrediting the honor, dignity, or business reputation of other users or third parties, or violating their
            privacy.
          </p>
          <p>
            <strong>b.</strong> Incitement of racial, religious, ethnic hatred, or enmity, including the promotion of
            fascism or ideologies of racial superiority.
          </p>
          <p>
            <strong>c.</strong> Any form of hatred against individuals or groups based on gender, race, ethnicity,
            nationality, religion, sexual orientation, gender identity, disabilities, or mental/physical health, or
            promoting violence or discrimination against such groups (including bullying).
          </p>
          <p>
            <strong>d.</strong> Incitement to conflict, violations of the Platform's terms, or breaches of applicable
            laws.
          </p>
          <p>
            <strong>e.</strong> Content depicting violent or brutal deaths, severe bodily injuries, dismemberment, or
            other graphic scenes, including images of physical violence, fights, or torture.
          </p>
          <p>
            <strong>f.</strong> Animal cruelty, such as bestiality, slaughter, dismemberment, or inhumane treatment of
            animals.
          </p>
          <p>
            <strong>g.</strong> Shock content designed to provoke negative emotions, such as fear, horror, or disgust,
            including depictions of accidents, natural disasters, or acts of terrorism.
          </p>

          <p>
            <strong>9.2.3 Potentially Dangerous Activities</strong>
          </p>
          <p>Private Challenges must not promote or involve:</p>
          <p>
            <strong>a.</strong> Misuse of dangerous tools, equipment, vehicles, or other hazardous objects.
          </p>
          <p>
            <strong>b.</strong> Consumption of substances that are harmful or not intended forningestion.
          </p>
          <p>
            <strong>c.</strong> Participation in dangerous games, stunts, or challenges that could result in injury.
          </p>
          <p>
            <strong>d.</strong> Risky physical activities (e.g., parkour, high diving, roofing, extreme sports).
          </p>

          <p>
            <strong>9.2.4 Extremism and Unauthorized Mass Events</strong>
          </p>
          <p>Private Challenges must not involve:</p>
          <p>
            <strong>a.</strong> Extremist materials or propaganda.
          </p>
          <p>
            <strong>b.</strong> Promotion of criminal activities or instructions for committing crimes.
          </p>
          <p>
            <strong>c.</strong> Calls to participate in unauthorized mass gatherings or riots.
          </p>
          <p>
            <strong>d.</strong> Content promoting extremist communities or activities.
          </p>

          <p>
            <strong>9.2.5 Suicide, Self-Harm, and Eating Disorders</strong>
          </p>
          <p>Private Challenges must not involve or promote:</p>
          <p>
            <strong>a.</strong> Methods or means of suicide, or incitement to commit suicide.
          </p>
          <p>
            <strong>b.</strong> Self-harm, eating disorders, or harmful weight-loss activities, including instructional
            content.
          </p>
          <p>
            <strong>c.</strong> Dangerous treatments, refusal of prescribed medications, or unproven medical methods.
          </p>

          <p>
            <strong>9.2.6 Actions Violating the Rights of Minors</strong>
          </p>
          <p>Private Challenges must not target or exploit minors by promoting:</p>
          <p>
            <strong>a.</strong> Any activity that infringes upon their legal rights.
          </p>
          <p>
            <strong>b.</strong> Vulgar or obscene content, including sexual imagery or texts involving minors.
          </p>
          <p>
            <strong>c.</strong> Activities encouraging or involving minors in illegal or dangerous actions.
          </p>
          <p>
            <strong>d.</strong> Distribution of child abuse materials or links to such materials.
          </p>
          <p>
            <strong>e.</strong> Depictions of minors smoking or consuming alcohol or illegal substances.
          </p>

          <p>
            <strong>9.2.7 Weapons</strong>
          </p>
          <p>Private Challenges must not involve or promote:</p>
          <p>
            <strong>a.</strong> Assisting or supporting armed conflicts or military operations.
          </p>
          <p>
            <strong>b.</strong> Distribution or sale of weapons, ammunition, or explosives.
          </p>
          <p>
            <strong>c.</strong> Manufacturing or modifying firearms or related components.
          </p>

          <p>
            <strong>9.2.8 Sexually Explicit or Inappropriate Content</strong>
          </p>
          <p>Private Challenges must not promote or include:</p>
          <p>
            <strong>a.</strong> Direct or indirect sexual acts, including intercourse, oral sex, or other explicit
            action.
          </p>
          <p>
            <strong>b.</strong> Promotion or organization of prostitution or related services.
          </p>
          <p>
            <strong>c.</strong> Distribution of erotic services or sexually explicit materials labeled 18+.
          </p>
          <p>
            <strong>d.</strong> Pornographic content, including explicit images, videos, or links to such materials.
          </p>

          <p>
            <strong>9.2.9 Drugs and Controlled Substances</strong>
          </p>
          <p>Private Challenges must not involve or promote:</p>
          <p>
            <strong>a.</strong> Use, distribution, or production of drugs or controlled substances.
          </p>
          <p>
            <strong>b.</strong> Sale or cultivation of narcotic substances.
          </p>
          <p>
            <strong>c.</strong> Storage, transportation, or processing of illegal drugs.
          </p>

          <p>
            <strong>9.2.10 Alcohol and Tobacco</strong>
          </p>
          <p>Private Challenges must not involve:</p>
          <p>
            <strong>a.</strong> Promotion or sale of alcoholic or tobacco products.
          </p>
          <p>
            <strong>b.</strong> Encouraging consumption of alcohol or tobacco (and other products containing nicotine).
          </p>

          <p>
            <strong>9.2.11 Medicines, Poisons and Dangerous Substances</strong>
          </p>
          <p>Private Challenges must not involve or promote:</p>
          <p>
            <strong>a.</strong> Consumption, sale or distribution of medicines or medical substances without proper
            authorization.
          </p>
          <p>
            <strong>b.</strong> Distribution of poisons or harmful chemicals.
          </p>
          <p>
            <strong>c.</strong> Distribution of banned pesticides, potent chemicals, or hazardous substances.
          </p>

          <p>
            <strong>9.2.12 Activities with High Financial Risks</strong>
          </p>
          <p>Private Challenges must not promote or include:</p>
          <p>
            <strong>a.</strong> Gambling, lotteries, or financial scams.
          </p>
          <p>
            <strong>b.</strong> Money laundering, fraudulent loans, or illegal payment schemes.
          </p>
          <p>
            <strong>c.</strong> Unauthorized trading of cryptocurrencies or financial instruments.
          </p>

          <p>
            <strong>9.2.13 Intellectual Property and Copyright Infringement</strong>
          </p>
          <p>Private Challenges must not involve:</p>
          <p>
            <strong>a.</strong> Unauthorized use, reproduction, or distribution of copyrighted materials.
          </p>

          <p>
            <strong>9.2.14 Misuse of Software and Hardware</strong>
          </p>
          <p>Private Challenges must not involve or encourage:</p>
          <p>
            <strong>a.</strong> Disrupting or interfering with the normal functioning of the Platform.
          </p>
          <p>
            <strong>b.</strong> Hacking, emulation, or creation of malicious software.
          </p>

          <p>
            <strong>9.2.15 Privacy Violations</strong>
          </p>
          <p>Private Challenges must not involve:</p>
          <p>
            <strong>a.</strong> Unauthorized access to user accounts or personal data.
          </p>
          <p>
            <strong>b.</strong> Distribution of sensitive or private information without consent.
          </p>

          <p>
            <strong>9.3</strong> You acknowledge and agree that we are not required to provide prior notice or
            explanation for any actions taken in response to your misuse of the Platform or the Services, including, but
            not limited to, the suspension or termination of your access to the Platform and its Services.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">10. DISCLAIMER OF LIABILITY</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>10.1</strong> The content available on the Platform or through the Services is provided "as is,"
            without any guarantees, conditions, or warranties regarding its accuracy.
          </p>
          <p>
            <strong>10.2</strong> To the fullest extent permitted by law, the Company expressly disclaims all warranties
            and conditions that may otherwise be implied by statute, common law, or equity of any jurisdiction. The
            Company shall not be liable for any damages of any kind, including but not limited to direct, indirect,
            special, consequential, punitive, or incidental damages, or damages resulting from the loss of use, profits,
            data, or other intangible assets, as well as any decrease in the value of Tokens, damage to goodwill or
            reputation, or the costs associated with obtaining substitute goods or services. This limitation applies to
            any claims arising out of or related to the use, inability to use, performance, or failure of the Platform,
            Services, Challenges, Private Challenges, or any materials available on the Platform, whether such damages
            were foreseeable or arise from contract, tort, equity, restitution, statutory obligations, or common law.
          </p>
          <p>
            <strong>10.3</strong> Company shall not be liable, in particular, for any damage, injury, illness, health
            impairment, or death arising from or in connection with the assignment or completion of a Private Challenge
            that violates the rules set forth in Article 9 of these T&Cs.
          </p>
          <p>
            <strong>10.4</strong> We shall not be liable for any loss or damage resulting from a distributed denialof-
            service attack, viruses, or other technologically harmful materials that may infect your computer equipment,
            software, data, or other proprietary materials as a consequence of your use of the Platform or your
            downloading of any content available on the Platform or linked websites.
          </p>
          <p>
            <strong>10.5</strong> We shall not be held liable for any loss of Tokens or assets arising from the
            suspension or termination of your access to the Platform and Services.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">11. INDEMNITY</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>11.1</strong> To the fullest extent permitted by law, you agree to indemnify, defend, and hold
            harmless the Company, its directors, oRicers, employees, consultants, agents, and affiliates from any and
            all liabilities, losses, damages, expenses, or thirdparty claims (including, but not limited to, legal fees
            on an indemnity basis) arising out of or related to:
          </p>
          <p>
            <strong>11.1.1</strong> your use or misuse of the Platform or Services;
          </p>
          <p>
            <strong>11.1.2</strong> any content submitted by you or on your behalf;
          </p>
          <p>
            <strong>11.1.3</strong> any violation or breach of these T&Cs by you;
          </p>
          <p>
            <strong>11.1.4</strong> any actual or alleged infringement of a third party's intellectual property rights
            or other rights related to your use of the Platform or Services; or
          </p>
          <p>
            <strong>11.1.5</strong> any unlawful, negligent, or wrongful act or omission by you or any person acting on
            your behalf.
          </p>
          <p>
            <strong>11.2</strong> Each indemnity provided under these T&Cs shall constitute a continuing obligation,
            remaining in eRect regardless of any account settlement or other circumstances. The Company is not required
            to incur any expenses or make any payments before enforcing or asserting a claim under the indemnity.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">12. INVALIDITY</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>12.1</strong> If any provision of these T&Cs is found to be unenforceable or invalid (including any
            provision limiting our liability to you), the remaining provisions shall remain unaRected and continue in
            full force and eRect. Where possible, any unenforceable or invalid clause or sub-clause shall be modified or
            severed to the extent necessary to render it enforceable, while preserving its original intent.
            Alternatively, you agree that the clause or sub-clause shall be reinterpreted in a manner that most closely
            reflects its intended meaning, as permitted by applicable law.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">13. FORCE MAJEURE</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>13.1</strong> The Company shall not be deemed in breach of these T&Cs, nor held liable for any
            failure or delay in fulfilling its obligations under these T&Cs, to the extent that such failure or delay is
            caused, directly or indirectly, by circumstances beyond the Company's reasonable control or by any act or
            omission on your part or that of any third party.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">14. ASSIGNMENT</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>14.1</strong> You may not assign or transfer, in whole or in part, your rights or obligations under
            these T&Cs without the prior written consent of the Company. The Company reserves the right to assign or
            transfer its rights and interests under these T&Cs at its discretion.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">15. WAIVER</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>15.1</strong> A right under these T&Cs may be waived only in writing signed by the party granting
            the waiver, and such a waiver will be effective solely to the extent expressly specified therein.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">16. EXCLUSION</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>16.1</strong> Unless otherwise provided, no third party shall have any rights or claims under these
            T&Cs, nor shall any provision be enforceable by anyone other than the parties bound by them.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">17. GOVERNING LAW AND JURISDICTION</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>17.1</strong> These T&Cs shall be governed by the laws of Costa Rica, and you agree to submit to the
            exclusive jurisdiction of the courts located in Costa Rica.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">18. AMENDMENTS</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>18.1</strong> The Company reserves the right to amend these T&Cs at its discretion. Any amendments
            shall take eRect immediately upon publication on this website without the need for prior notification on the
            Platform or through the Services. By continuing to use the Platform and Services after such amendments, you
            agree to be bound by the updated T&Cs.
          </p>
        </div>
      </section>
    </div>
  );

  const renderPrivacyContent = () => (
    <div className="space-y-6 text-gray-300 leading-relaxed">
      <div className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <strong>Updated Date:</strong> Apr 7, 2025, 12:00 AM
      </div>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">1. PREAMBLE</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>1.1.</strong> NOCENA LLC is the operator of the NOCENA Web3 SocialFi Platform and serves as the
            controller of the information and personal data collected or provided through the Platform and the related
            Services. The processing of personal databy the Company is subject to this privacy policy, as amended and in
            eIect at the time (hereinafter as the "Privacy policy").
          </p>
          <p>
            <strong>1.2.</strong> The use of the Platform and the related Services, available within or inconnection
            with the Platform, is subject to the T&Cs, available at https://www.nocena.com/terms-conditions. The Privacy
            policy constitutes an integral part of the T&Cs pursuant to Article 5.1 of the T&Cs. By accessing and using
            the Platform and related Services, you are agreeing to the T&Cs, as well as the Privacy policy. You agree to
            regularly check the Privacy policy to take noticeof any changes that may have been made.
          </p>
          <p>
            <strong>1.3.</strong> Personal data mean any information or opinion, whether accurate or not and whether
            recorded in a material form or not, that relates to an identified individual or an individual who can be
            reasonably identified. This may include, but is not limited to, your name, username, password, IP address,
            unique device identifiers, physical address, phone number, email, date of birth, bank account and digital
            wallet details, billing information, credit or debit card details, photographs and videos featuring you,
            identification credentials, biographical details, and comments or opinions about you (hereinafter as
            "personal data").
          </p>
          <p>
            <strong>1.4.</strong> Any capitalized but undefined term in this Privacy policy shall have the meaning
            defined in the T&Cs.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">2. SCOPE OF THE PRIVACY POLICY</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>2.1</strong> For the purposes of this Privacy policy, "processing," "processed," or "process" refers
            to any operation or series of operations performed on personal data or sets of personal data (excluding
            disclosure), whether carried out by automated means or otherwise. This includes, but is not limited to, the
            collection, recording, organization, storage, use, modification, structuring, retrieval, consultation,
            alignment or combination, restriction, deletion, or destruction of such data.
          </p>
          <p>
            <strong>2.2</strong> The Platform can be accessed only using a user account created by each user. We
            therefore process only data provided by registered users. These data include, but are not limited to:
          </p>
          <p>
            <strong>2.2.1</strong> Contact data: We process usernames, email addresses and digital wallet identification
            numbers.
          </p>
          <p>
            <strong>2.2.2</strong> User-Submitted personal data: We process information you submit to personalize your
            account or fulfill a specific function, such as your name, date of birth, age, interests, preferences,
            feedback, marketing preferences, and communication preferences. Additionally, we process any other
            information you voluntarily provide for a designated function.
          </p>
          <p>
            <strong>2.2.3</strong> Online forms and communication data: We process data and other information submitted
            through online forms available on the Platform, as well as information sent via email, online support chats,
            or other communication channels. This includes data provided in the context of support requests, inquiries,
            content reporting, content moderation, and complaint handling.
          </p>
          <p>
            <strong>2.2.4</strong> Website activity data: We process information related to your usage of the Platform,
            including interactions with products, services, content, and advertisements. This includes pages visited,
            search history on the Platform etc. Additionally, we process browser and operating system details, device
            information, time zone settings, and online identifiers. Specifically, we collect and process internet
            protocol (IP) address information and set cookies, as further detailed in Section 6 of this Privacy policy.
          </p>
          <p>
            <strong>2.2.5</strong> User submitted content, including audio/video information: The Platform provides an
            interactive area where users can share information about themselves and others, engage in communications,
            upload content (such as images and video files), and post comments on the content available on the Platform.
          </p>
          <p>
            <strong>2.3</strong> We may process your data for the purpose of creating and sharing aggregated insights
            that neither directly nor indirectly identify you and are not linked to you in any way. Such aggregated
            information does not constitute personal data.
          </p>
          <p>
            <strong>2.4</strong> The Platform prohibits access and use by minors. The Platform is designated to
            individuals who are at least 18 years old or have attained the legal age of majority in their jurisdiction
            of access. We do not knowingly collect, store, or process personal data of minors.
          </p>
          <p>
            <strong>2.5</strong> We do not collect any sensitive personal data, including but not limited to passwords
            for other services, information related to physical, physiological, or mental health conditions, sexual
            orientation, medical records and history, or biometric data.
          </p>
          <p>
            <strong>2.6</strong> The Platform and Services are partly connected to blockchain technology. Blockchains
            are immutable, meaning that transactions and certain information related to users are permanently stored on
            the blockchain. Once recorded, this information cannot be altered or removed. By using the Platform, you
            acknowledge and understand that any data stored on the blockchain will remain there indefinitely, and we
            have no ability to modify or delete it.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">3. THE SOURCES OF PERSONAL DATA</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>3.1</strong> We process personal data collected from the following sources:
          </p>
          <p>
            <strong>3.1.1</strong> Directly from you: We collect and process the categories of information specified
            above directly from you.
          </p>
          <p>
            <strong>3.1.2</strong> Automated technologies and interactions: As detailed in Section 6 of this Privacy
            policy, we use cookies and other automated tools to collect and process website activity data when you
            access the Platform.
          </p>
          <p>
            <strong>3.1.3</strong> Third-parties: We may receive certain information from other platforms, such as your
            name, email address, or other details you have provided and authorized the third party to share with us.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">4. PURPOSES FOR PERSONAL DATA PROCESSING</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>4.1</strong> We process personal data for the following purposes:
          </p>
          <p>
            <strong>4.1.1</strong> Provision of Services: We process identifiers, website activity data, and personal
            data (if voluntarily submitted as described above). Additionally, we process user contributions (user
            content), including any interactions with Platform's features, products, or Services. We also use this data
            to verify eligibility and distribute Tokens in connection with Challenges and Private Challenges.
          </p>
          <p>
            <strong>4.1.2</strong> Customer management: We process identifiers and personal data to manage user
            accounts, provide customer support, send account related notifications, and inform users of updates or
            changes to the Platform or the Services.
          </p>
          <p>
            <strong>4.1.3</strong> Customization of content and marketing: We process identifiers and website activity
            data. Additionally, we process user-submitted personal data and user contributions to analyze engagement
            with content, products, or Services, and to display tailored content and advertisements based on user
            interests.
          </p>
          <p>
            <strong>4.1.4</strong> Analytics: We process identifiers and website activity data to determine unique user
            visits, track user engagement over multiple sessions, and monitor aggregate metrics, such as the total
            number of visitors, page views, and demographic trends.
          </p>
          <p>
            <strong>4.1.5</strong> Functionality and security: We may process any of the data categories mentioned in
            this Privacy policy to diagnose and resolve technical issues, detect and prevent fraud, illegal activities,
            or intellectual property infringement, and enhance the security of the Platform.
          </p>
          <p>
            <strong>4.1.6</strong> Platform safety: We use collected information to promote user safety and security,
            protecting Platform users from harm while ensuring a safe and secure experience on the Platform.
          </p>
          <p>
            <strong>4.1.7</strong> Compliance: We may process any of the data categories referenced in this Privacy
            policy to enforce compliance with this Privacy policy, our T&Cs, and applicable legal obligations. This
            includes, but is not limited to, responding to data subject requests, handling content reports, and ensuring
            compliance with content moderation.
          </p>
          <p>
            <strong>4.1.8</strong> Information you provide: We will process personal data and user submitted personal
            information in accordance with the purposes described at the time the information is provided or for any
            other purpose expressly consented to separately from this Privacy policy.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">5. DISCLOSURE OF PERSONAL DATA</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>5.1</strong> We disclose your personal data when necessary to provide our Services or for other
            purposes outlined in this Privacy policy. When sharing your personal data, we typically rely on one or more
            of the following legal bases: the performance of our contractual obligations to you, compliance with legal
            obligations, our legitimate business interests (such as operating the Platform), or your consent.
          </p>
          <p>
            <strong>5.2</strong> Parties to whom we may disclose your personal data:
          </p>
          <p>
            <strong>5.2.1</strong> The public: When you submit content, including audio/video content, certain details
            about you - such as uploaded content and profile information - may be publicly displayed on the Platform.
            Publicly available content may be accessible globally by anyone who has access to the Platform.
          </p>
          <p>
            <strong>5.2.2</strong> Our employees and contractors: To provide Services, certain employees and contractors
            may be granted access to your personal data on a needto- know basis. These individuals are bound by
            confidentiality obligations.
          </p>
          <p>
            <strong>5.2.3</strong> Our corporate group: We may disclose personal data to aIiliated entities within our
            corporate group where necessary for the purposes described in this Privacy policy, including but not limited
            to identification, transaction monitoring and payment processing, customer support, distribution of Tokens,
            business development, account administration, IT, technical support, and engineering services.
          </p>
          <p>
            <strong>5.2.4</strong> Service provides: We share certain categories of personal data with authorized
            service providers who assist us in delivering our Services in accordance with our T&Cs. These service
            providers may process personal data solely on our behalf for purposes such as identification, fraud
            detection and prevention, risk mitigation, evaluation of the performance of Challenges, customer support,
            marketing and advertising, content customization, analytics, security, hosting, or other functionalities
            essential to the Platform. These providers are granted limited access to personal data necessary for their
            functions and are prohibited from processing it for any other purposes. These providers may use AI
            technology, especially in relation to user submitted content.
          </p>
          <p>
            <strong>5.2.5</strong> Legal successors: In the event of a merger, acquisition, sale, or transfer of some or
            all of our assets—whether as a going concern, bankruptcy, liquidation, or a similar proceedin —we may
            transfer all categories of personal data we process to the acquiring entity or successor. Such transfers are
            based on our legitimate business interest in making decisions that support our business development.
          </p>
          <p>
            <strong>5.3</strong> We may access, retain, and disclose personal data when reasonably necessary to:
          </p>
          <p>
            <strong>5.3.1</strong> Comply with applicable laws, regulations, court orders, legal proceedings, or
            government or public authority requests.
          </p>
          <p>
            <strong>5.3.2</strong> Enforce our T&Cs, including preventing potential violations.
          </p>
          <p>
            <strong>5.3.3</strong> Detect, prevent, or address illegal activities, suspected misconduct, security risks,
            or technical issues.
          </p>
          <p>
            <strong>5.3.4</strong> Protect the rights, property, or safety of our company, users, employees, or others.
          </p>
          <p>
            <strong>5.3.5</strong> Maintain and safeguard the security and integrity of the Platform infrastructure and
            operations.
          </p>
          <p>
            In such cases, we reserve the right to assert or waive any legal objections or rights at our sole
            discretion.
          </p>
          <p>
            <strong>5.4</strong> We do not assume any responsibility for the security or safety of your personal data.
            However, we implement reasonable security measures in accordance with industry standards to protect your
            data. Nevertheless, we cannot guarantee absolute security, as unforeseen events beyond our control may
            occur.
          </p>
          <p>
            <strong>5.5</strong> By submitting content, you make this content and information publicly accessible. User
            contributions may be read, collected, used, and shared by others, and we cannot control who accesses your
            content or how others may use the information you voluntarily disclose or submit. User content is subject to
            the T&Cs.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">6. COOKIES</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>6.1</strong> When you access and use the Platform, we use automated data collection technologies to
            gather information about website activity. These technologies may include cookies, which are small text
            files stored in your web browser or downloaded to your device when you access the Platform.
          </p>
          <p>
            <strong>6.2</strong> We use the following types of cookies on the Platform:
          </p>
          <p>
            <strong>6.2.1</strong> Essential cookies: These cookies are necessary for the operation of the Platform.
            They include, for example, cookies that enable users to log in and verify whether they have access to
            certain Services or content.
          </p>
          <p>
            <strong>6.2.2</strong> Functional cookies: These cookies help us personalize and enhance your experience on
            the Platform. They allow us to recognize you when you return to the site and remember your preferences.
          </p>
          <p>
            <strong>6.2.3</strong> Analytical cookies: These cookies enable us to identify and count the number of users
            and understand how they navigate and interact with the Platform and uploaded content. They help us improve
            the Platform and Services by ensuring users can easily find what they are looking for. Additionally, we may
            use third-party session recording technologies to gain a better understanding of user experience.
          </p>
          <p>
            <strong>6.2.4</strong> Targeting and Advertising cookies: These cookies record your visits to the Platform,
            including the pages you view and the links you follow, to make the Platform more relevant to your interests
            and to display ads that may be of interest to you.
          </p>
          <p>
            <strong>6.3</strong> You can disable analytical, functional, and advertising/targeting cookies at any time
            using the "Manage Cookies" option located on the Platform. However, if you decline these cookies, certain
            features of the Platform may be disabled, potentially restricting access to specific parts of the Platform.
          </p>
          <p>
            <strong>6.4</strong> Cookies may be session cookies or persistent cookies:
          </p>
          <p>
            <strong>6.4.1</strong> Session cookies expire automatically when you close your browser.
          </p>
          <p>
            <strong>6.4.2</strong> Persistent cookies remain stored until they expire or are manually deleted.
            Expiration dates are set within the cookies themselves, with some expiring within minutes and others lasting
            for several years.
          </p>
          <p>
            <strong>6.5</strong> Our systems do not recognize "Do Not Track" browser signals.
          </p>
          <p>
            <strong>6.6</strong> We use Google as a service provider to collect and analyze information on how users
            interact with the Platform. This includes gathering website activity data through both first-party cookies
            (set by our domains) and third-party cookies (set by Google). Information collected by Google Analytics may
            be transferred to and stored by Google.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">7. USER CHOICE REGARDING PERSONAL DATA</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>7.1</strong> We aim to provide you with options regarding the personal data you share with us:
          </p>
          <p>
            <strong>7.1.1</strong> Providing personal data: You may choose not to provide certain personal data;
            however, this may limit your ability to use specific features of the Platform and the Services. Some
            information may be required to create an account, access the Platform or Services, participate in
            challenges, communicate with our support teams, or engage in other activities on the Platform.
          </p>
          <p>
            <strong>7.1.2</strong> Cookie preferences: The Cookie Banner allows you to manage your cookie settings. It
            records your consent for the use of cookies. The Cookie Banner manages functionality, analytics, and
            advertising cookies used on the Platform, but does not aIect strictly necessary cookies or cookies on
            third-party websites. You can access the Cookie Banner at any time by selecting "Manage Cookies" on the
            Platform.
          </p>
          <p>
            <strong>7.1.3</strong> Managing user content: You may delete your submitted content, including audio/video
            content, through your account settings.
          </p>
          <p>
            <strong>7.1.4</strong> Account deletion and deactivation: You may delete or deactivate your account at any
            time unless legal or court orders prevent us from processing such a request. Once deactivated, your profile
            will no longer be accessible to you. Should you wish to create a new account in the future, you will need to
            re-register, as previously provided or saved information will not be retained.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">8. RETENTION OF PERSONAL DATA</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>8.1</strong> We retain your personal data only for as long as your account remains active or as
            necessary to fulfill the purposes for which it was collected, including compliance with legal, accounting,
            and regulatory obligations, this Privacy policy and the T&Cs.
          </p>
          <p>
            <strong>8.2</strong> When determining the appropriate retention period for personal data, we consider
            several factors, including the type of data being processed, the potential risk of harm from unauthorized
            disclosure, the purpose of processing, and whether the intended outcome can be achieved through alternative
            means without processing the data.
          </p>
          <p>
            <strong>8.3</strong> Once your personal data is no longer required for the purposes outlined in this Privacy
            policy, we will delete it from our systems.
          </p>
          <p>
            <strong>8.4</strong> Where possible, we will also delete your personal data upon request, as described in
            Section 10 of this Privacy policy.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">9. THIRD PARTY LINKS</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>9.1</strong> If you click on a link to a third-party website, you will be redirected to an external
            site that we do not control. This Privacy policy does not govern the privacy practices of such third-party
            websites. We strongly encourage you to review their respective privacy policies carefully. We assume no
            responsibility for the data practices or policies of these third parties.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">10. YOUR RIGHTS</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>10.1</strong> Subject to local laws, applicable legal requirements, and exemptions, you have certain
            rights concerning your personal data, including:
          </p>
          <p>
            <strong>10.1.1</strong> Right of access: You have the right to request information about the personal data
            we hold about you, how it is used, and to obtain a copy of such data.
          </p>
          <p>
            <strong>10.1.2</strong> Right of rectification: You have the right to correct any inaccurate or incomplete
            personal data concerning you.
          </p>
          <p>
            <strong>10.1.3</strong> Right to erasure: You have the right to request the deletion of your personal data.
          </p>
          <p>
            <strong>10.1.4</strong> Right to data portability: You have the right to receive the personal data you
            provided to us in a structured, commonly used, and machine readable format and to transmit it to another
            data controller.
          </p>
          <p>
            <strong>10.1.5</strong> Right to object: You have the right to object to the processing of your personal
            data where it is based on our legitimate interests or the public interest.
          </p>
          <p>
            <strong>10.1.6</strong> Right to restrict processing: In certain cases, you have the right to request that
            we limit the processing of your personal data.
          </p>
          <p>
            <strong>10.1.7</strong> Right to file a complaint: You have the right to lodge a complaint with your local
            data protection authority.
          </p>
          <p>
            <strong>10.2</strong> If we process your personal data based on your consent, you have the right to withdraw
            that consent at any time with future eIect. Please note that withdrawing consent may result in the inability
            to use certain functionalities on the Platform or, in some cases, access the Platform altogether.
          </p>
          <p>
            <strong>10.3</strong> To exercise the rights under this section you have to contact our support team. We
            will respond to your request within three (3) months. Before processing any access or deletion request, we
            will take appropriate steps to verify your identity and confirm your right to access or delete the requested
            data. This security measure ensures that personal data is not disclosed to unauthorized persons or deleted
            in an improper manner.
          </p>
          <p>
            <strong>10.4</strong> Certain requests to delete specific personal data may require the deletion of your
            entire user account, as maintaining a user account is inherently linked to the processing of certain
            personal information. If you choose to delete your account, all associated data—including, but not limited
            to, user profile details, shared content, and any other account-specific data—will no longer be accessible.
            If, after deleting your account, you wish to create a new one in the future, you will need to register
            again, as no previously stored data will be recoverable.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">11. ASSIGNMENT</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>11.1</strong> You may not assign or transfer, in whole or in part, your rights or obligations under
            this Privacy policy without the prior written consent of the Company. The Company reserves the right to
            assign or transfer its rights and interests under this Privacy policy at its discretion.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">12. WAIVER</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>12.1</strong> A right under this Privacy policy may be waived only in writing signed by the party
            granting the waiver, and such a waiver will be eIective solely to the extent expressly specified therein.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">13. EXCLUSION</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>13.1</strong> Unless otherwise provided, no third party shall have any rights or claims under this
            Privacy policy, nor shall any provision be enforceable by anyone other than the parties bound by them.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">14. GOVERNING LAW AND JURISDICTION</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>14.1</strong> This Privacy policy shall be governed by the laws of Costa Rica, and you agree to
            submit to the exclusive jurisdiction of the courts located in Costa Rica.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">15. AMENDMENTS</h3>
        <div className="space-y-3 text-sm">
          <p>
            <strong>15.1</strong> The Company reserves the right to amend this Privacy policy at its discretion. Any
            amendments shall take eIect immediately upon publication on this website without the need for prior
            notification on the Platform or through the Services. By continuing to use the Platform and Services after
            such amendments, you agree to be bound by the updated Privacy policy.
          </p>
        </div>
      </section>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-nocenaPink to-nocenaPurple rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none">
            {type === 'terms' ? renderTermsContent() : renderPrivacyContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-nocenaBlue to-nocenaPink text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium tracking-wide"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalPopupModal;

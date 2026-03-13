import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FileText, Shield, RefreshCw, AlertCircle, ChevronLeft, ExternalLink } from 'lucide-react';

const LAST_UPDATED = 'March 1, 2026';
const COMPANY = 'EuroVault Technologies Ltd.';
const EMAIL   = 'legal@eurovault.eu';
const ADDRESS = 'Av. da Liberdade 110, 1250-096 Lisbon, Portugal';
const REG     = 'Registration No. CY-12345-B, supervised by CySEC';

const NAV_ITEMS = [
  { slug: 'terms',   label: 'Terms of Service',    icon: FileText   },
  { slug: 'privacy', label: 'Privacy Policy',       icon: Shield     },
  { slug: 'refund',  label: 'Refund Policy',        icon: RefreshCw  },
  { slug: 'aml',     label: 'AML Policy',           icon: AlertCircle},
];

/* ── Section renderer ── */
function Section({ number, title, children }) {
  return (
    <section style={{ marginBottom: '2.4rem' }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0d1b2a', marginBottom: '0.7rem',
                   display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#3A86FF', minWidth: 26,
                       background: 'rgba(58,134,255,0.08)', padding: '2px 6px',
                       borderRadius: 5, textAlign: 'center' }}>{number}</span>
        {title}
      </h2>
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, paddingLeft: 36 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }) {
  return <p style={{ margin: '0 0 0.8rem' }}>{children}</p>;
}

function Ul({ items }) {
  return (
    <ul style={{ margin: '0.4rem 0 0.8rem', paddingLeft: '1.4rem' }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: '0.35rem' }}>{item}</li>)}
    </ul>
  );
}

/* ════════════════════════════════════════════════════════════
   TERMS OF SERVICE
════════════════════════════════════════════════════════════ */
function TermsContent() {
  return (
    <>
      <Section number="1" title="Acceptance of Terms">
        <P>By accessing or using the EuroVault Platform ("Platform"), a cloud-based data analytics and financial market intelligence software-as-a-service ("SaaS") operated by {COMPANY} ("Company", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Platform.</P>
        <P>These Terms constitute a legally binding agreement between you and the Company. By clicking "I Agree", creating an account, or otherwise accessing the Platform, you represent that you have read, understood, and accept these Terms in their entirety.</P>
      </Section>

      <Section number="2" title="Description of Service">
        <P>The EuroVault Platform is a subscription-based SaaS product that provides users with access to real-time and historical financial market data, analytical tools, data visualisation dashboards, portfolio simulation environments, and market intelligence reports for research and analytical purposes.</P>
        <P>The Platform is strictly a data analysis and information technology tool. It does not constitute:</P>
        <Ul items={[
          'Investment advice, financial planning, or portfolio management services',
          'A brokerage, exchange, or trading platform for actual financial instruments',
          'Any regulated financial service requiring licensure under applicable securities laws',
          'A recommendation to buy, sell, or hold any security, currency, or financial instrument',
        ]} />
        <P>All data and analysis provided through the Platform are for informational and educational purposes only. Users bear full responsibility for any decisions made based on information obtained through the Platform.</P>
      </Section>

      <Section number="3" title="Eligibility and Account Registration">
        <P>To access the Platform, you must: (a) be at least 18 years of age; (b) have the legal capacity to enter into a binding contract; (c) not be prohibited from using the Platform under applicable law; and (d) provide accurate, current, and complete registration information.</P>
        <P>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorised use of your account at {EMAIL}.</P>
        <P>The Company reserves the right to suspend or terminate accounts that provide false information, violate these Terms, or engage in any activity that is harmful to the Platform, other users, or third parties.</P>
      </Section>

      <Section number="4" title="Subscription Plans and Payment">
        <P>Access to the Platform requires a valid subscription. Subscription fees are charged in advance on a monthly or annual basis, as selected at the time of purchase. All fees are quoted in Euros (€) and are exclusive of applicable taxes.</P>
        <P>You authorise us to charge the payment method on file for all amounts due. Subscriptions automatically renew at the end of each billing cycle unless cancelled at least 48 hours before the renewal date. Failure to pay subscription fees may result in immediate suspension of access.</P>
        <P>We reserve the right to change subscription pricing with 30 days' advance notice. Continued use of the Platform after a price change constitutes acceptance of the new pricing.</P>
      </Section>

      <Section number="5" title="Intellectual Property Rights">
        <P>The Platform, including but not limited to its software, design, text, graphics, data compilations, algorithms, and user interface, is the exclusive intellectual property of {COMPANY} and its licensors, protected by copyright, trademark, and other applicable laws.</P>
        <P>Subject to your compliance with these Terms and payment of applicable fees, we grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform solely for your personal or internal business data analysis purposes.</P>
        <P>You may not: copy, modify, distribute, sell, or sublicense the Platform; reverse engineer or attempt to extract source code; use the Platform to build a competing product; or remove any proprietary notices or labels.</P>
      </Section>

      <Section number="6" title="Acceptable Use Policy">
        <P>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You shall not use the Platform to:</P>
        <Ul items={[
          'Violate any applicable local, national, or international law or regulation',
          'Transmit unsolicited commercial communications or spam',
          'Introduce viruses, trojans, worms, or other malicious code',
          'Attempt to gain unauthorised access to any part of the Platform',
          'Harvest, collect, or store personal data about other users without consent',
          'Engage in market manipulation, insider trading, or other financial fraud',
          'Reproduce, sell, or commercially exploit Platform content without written authorisation',
        ]} />
      </Section>

      <Section number="7" title="Disclaimer of Warranties">
        <P>THE PLATFORM AND ALL DATA, CONTENT, AND SERVICES PROVIDED THROUGH IT ARE OFFERED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</P>
        <P>We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses; that market data provided will be accurate, complete, or timely; or that results obtained from using the Platform will be accurate or reliable. Market data is sourced from third-party providers and may be subject to delays, inaccuracies, or omissions.</P>
      </Section>

      <Section number="8" title="Limitation of Liability">
        <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} AND ITS DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF DATA, LOSS OF GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE PLATFORM.</P>
        <P>In no event shall our aggregate liability exceed the total fees paid by you to the Company in the twelve (12) months preceding the event giving rise to the claim.</P>
      </Section>

      <Section number="9" title="Governing Law and Dispute Resolution">
        <P>These Terms shall be governed by and construed in accordance with the laws of the Republic of Cyprus, without regard to its conflict of law provisions. Any dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Limassol, Cyprus.</P>
        <P>Prior to initiating any legal proceedings, the parties agree to attempt to resolve disputes through good-faith negotiation for a period of not less than 30 days.</P>
      </Section>

      <Section number="10" title="Modifications to Terms">
        <P>We reserve the right to modify these Terms at any time. Material changes will be notified by email to registered users or by a prominent notice on the Platform at least 14 days before the changes take effect. Continued use of the Platform after such notice constitutes acceptance of the revised Terms.</P>
        <P>It is your responsibility to review these Terms periodically. The current version is always available at {window.location.origin}/legal/terms.</P>
      </Section>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   PRIVACY POLICY
════════════════════════════════════════════════════════════ */
function PrivacyContent() {
  return (
    <>
      <Section number="1" title="Introduction and Data Controller">
        <P>{COMPANY} ("we", "us", "our") is the data controller responsible for processing your personal data in connection with the EuroVault Platform. We are committed to protecting your privacy and handling your data in a transparent, secure, and lawful manner in accordance with the General Data Protection Regulation (EU) 2016/679 ("GDPR") and applicable national data protection laws.</P>
        <P>This Privacy Policy explains what personal data we collect, how we use it, with whom we share it, and the rights you have regarding your data. For any privacy-related enquiries, please contact our Data Protection Officer at {EMAIL}.</P>
      </Section>

      <Section number="2" title="Personal Data We Collect">
        <P>We collect personal data in the following categories:</P>
        <Ul items={[
          'Identity Data: full name, date of birth, government-issued identification number',
          'Contact Data: email address, telephone number, postal address',
          'Account Data: username, encrypted password, subscription status, preferences',
          'Financial Data: payment card details (tokenised), billing address, transaction history',
          'Technical Data: IP address, browser type and version, device identifiers, operating system, referral source',
          'Usage Data: pages visited, features accessed, session duration, clickstream data',
          'Communications Data: records of correspondence with our support team',
        ]} />
        <P>We do not intentionally collect Sensitive Personal Data (as defined under GDPR Article 9) without your explicit consent. If you provide such data, you consent to its processing for the stated purposes.</P>
      </Section>

      <Section number="3" title="Legal Basis and Purposes of Processing">
        <P>We process your personal data on the following legal bases:</P>
        <Ul items={[
          'Contractual Necessity (GDPR Art. 6(1)(b)): to provide and manage your subscription, process payments, and deliver Platform services',
          'Legal Obligation (GDPR Art. 6(1)(c)): to comply with AML/KYC regulations, tax law, and regulatory reporting requirements',
          'Legitimate Interests (GDPR Art. 6(1)(f)): to prevent fraud, improve Platform security, conduct analytics, and develop our services',
          'Consent (GDPR Art. 6(1)(a)): to send marketing communications and use non-essential cookies (you may withdraw consent at any time)',
        ]} />
      </Section>

      <Section number="4" title="Data Sharing and Third Parties">
        <P>We share personal data with trusted third parties only to the extent necessary to operate the Platform:</P>
        <Ul items={[
          'Payment Processors: to securely process subscription payments (PCI DSS compliant)',
          'Cloud Infrastructure Providers: to host and maintain the Platform infrastructure',
          'Analytics Providers: to understand Platform usage patterns (data pseudonymised)',
          'Legal and Regulatory Authorities: when required by law, court order, or regulatory request',
          'Professional Advisors: lawyers, auditors, and compliance consultants under confidentiality obligations',
        ]} />
        <P>We do not sell, rent, or trade your personal data to third parties for marketing purposes. Any international data transfers are subject to appropriate safeguards, including Standard Contractual Clauses approved by the European Commission.</P>
      </Section>

      <Section number="5" title="Data Retention">
        <P>We retain personal data for as long as necessary to fulfil the purposes for which it was collected, and in accordance with legal obligations:</P>
        <Ul items={[
          'Account Data: for the duration of your subscription plus 7 years following account closure',
          'Financial and Transaction Records: minimum 7 years as required by applicable tax and AML legislation',
          'Technical and Usage Data: up to 24 months from collection',
          'Support Communications: 3 years from the date of last interaction',
        ]} />
      </Section>

      <Section number="6" title="Your Data Subject Rights">
        <P>Under the GDPR, you have the following rights with respect to your personal data:</P>
        <Ul items={[
          'Right of Access (Art. 15): to receive a copy of your personal data',
          'Right to Rectification (Art. 16): to correct inaccurate or incomplete data',
          'Right to Erasure (Art. 17): to request deletion of data in certain circumstances',
          'Right to Restriction (Art. 18): to restrict processing in specific situations',
          'Right to Data Portability (Art. 20): to receive your data in a structured, machine-readable format',
          'Right to Object (Art. 21): to object to processing based on legitimate interests',
          'Rights Related to Automated Decision-Making (Art. 22)',
        ]} />
        <P>To exercise any of these rights, submit a written request to {EMAIL}. We will respond within 30 days. You also have the right to lodge a complaint with the Cyprus Commissioner for Personal Data Protection or the data protection authority of your EU Member State.</P>
      </Section>

      <Section number="7" title="Cookies and Tracking Technologies">
        <P>We use cookies and similar tracking technologies to ensure the proper functioning of the Platform, analyse usage, and improve user experience. Cookie categories include:</P>
        <Ul items={[
          'Strictly Necessary Cookies: essential for Platform operation and security (cannot be disabled)',
          'Performance Cookies: collect anonymous usage statistics to improve the Platform',
          'Functional Cookies: remember your preferences such as language and currency settings',
          'Analytical Cookies: enable us to understand how users interact with the Platform',
        ]} />
        <P>You can manage your cookie preferences at any time through the Platform's cookie settings or your browser settings. Disabling certain cookies may affect Platform functionality.</P>
      </Section>

      <Section number="8" title="Security Measures">
        <P>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction, including:</P>
        <Ul items={[
          'Transport Layer Security (TLS 1.3) for all data in transit',
          'AES-256 encryption for data at rest',
          'Multi-factor authentication for administrative access',
          'Regular penetration testing and security audits',
          'Role-based access control with principle of least privilege',
          'ISO 27001-aligned information security management',
        ]} />
      </Section>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   REFUND POLICY
════════════════════════════════════════════════════════════ */
function RefundContent() {
  return (
    <>
      <Section number="1" title="Overview">
        <P>This Refund Policy governs the terms under which {COMPANY} ("Company") processes refund requests for subscriptions to the EuroVault Platform ("Platform"). We are committed to fair and transparent billing practices and aim to resolve all refund requests promptly and equitably.</P>
        <P>By subscribing to the Platform, you acknowledge and agree to the terms of this Refund Policy. This Policy is incorporated by reference into our Terms of Service.</P>
      </Section>

      <Section number="2" title="Subscription Model and Billing">
        <P>The EuroVault Platform is offered as a subscription service billed on a monthly or annual basis. Subscriptions are charged in advance at the beginning of each billing cycle. Given the nature of SaaS services—where you are provided immediate access to all Platform features upon payment—we apply specific conditions to refund eligibility.</P>
        <P>All subscription fees are exclusive of value-added tax (VAT) and other applicable taxes, which are added at the applicable rate based on your jurisdiction.</P>
      </Section>

      <Section number="3" title="Refund Eligibility">
        <P><strong>14-Day Money-Back Guarantee (New Subscribers):</strong> First-time subscribers who have not previously held a paid subscription are entitled to request a full refund within 14 calendar days of their initial subscription payment, provided that the Platform has been accessed for fewer than 3 cumulative hours during the refund window. This guarantee applies once per user account.</P>
        <P><strong>Service Disruption Credits:</strong> In the event of Platform unavailability exceeding 99.0% monthly uptime as measured by our monitoring systems, affected subscribers may request a pro-rata service credit. Credits are applied to future billing cycles and are not refunded as cash. Uptime SLA documentation is available upon written request.</P>
        <P><strong>Billing Errors:</strong> If you are charged an incorrect amount due to a billing error on our part, we will issue a full refund of the overcharged amount within 10 business days of verification.</P>
        <P><strong>Duplicate Charges:</strong> Duplicate charges resulting from a technical error will be refunded in full, including any bank fees incurred as a result of the duplicate transaction, upon submission of supporting documentation.</P>
      </Section>

      <Section number="4" title="Non-Refundable Circumstances">
        <P>The following are expressly excluded from refund eligibility:</P>
        <Ul items={[
          'Monthly subscription renewals that have been in effect for more than 72 hours',
          'Annual subscriptions after the 14-day money-back guarantee period has expired',
          'Partial months of service upon voluntary account cancellation',
          'Subscriptions purchased through third-party resellers or marketplace platforms',
          'Accounts suspended or terminated for violation of our Terms of Service or AML Policy',
          'Data downloads, API calls, or other one-time usage charges',
          'Promotional or discounted subscriptions obtained through special offers',
          'Subscriptions where the user has accessed premium data features extensively during the billing period',
        ]} />
      </Section>

      <Section number="5" title="How to Request a Refund">
        <P>To submit a refund request, please contact our Billing Team at {EMAIL} with the subject line "Refund Request — [Account Email]". Your request must include:</P>
        <Ul items={[
          'Full name and email address associated with the account',
          'Transaction ID or invoice number',
          'Date of the charge',
          'Reason for the refund request',
          'Supporting documentation (if applicable, e.g., for billing errors or duplicate charges)',
        ]} />
        <P>We will acknowledge your request within 2 business days and provide a decision within 10 business days. Approved refunds are processed to the original payment method and may take 5-10 business days to appear on your statement, depending on your bank or card issuer.</P>
      </Section>

      <Section number="6" title="Subscription Cancellation">
        <P>You may cancel your subscription at any time through the account settings panel. Upon cancellation, your access to the Platform will continue until the end of the current paid billing period. No refund is issued for the unused portion of the current billing period unless expressly provided for under Section 3 above.</P>
        <P>For annual subscriptions, if you cancel after the 14-day money-back period, you will retain Platform access until the end of the annual term. No partial-year refunds are provided.</P>
      </Section>

      <Section number="7" title="Chargebacks and Disputes">
        <P>We encourage users to contact our Billing Team before initiating a chargeback with their bank or card issuer. Initiating a chargeback without first attempting resolution through our support channels may result in immediate account suspension and potential recovery of the disputed amount through legal means.</P>
        <P>If you believe a charge is fraudulent or unauthorised, please contact us immediately at {EMAIL} so we can investigate and, if appropriate, issue a refund without the need for a chargeback.</P>
      </Section>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   AML POLICY
════════════════════════════════════════════════════════════ */
function AMLContent() {
  return (
    <>
      <Section number="1" title="Introduction and Policy Statement">
        <P>{COMPANY} ("Company") is committed to the highest standards of compliance with anti-money laundering (AML) and counter-terrorism financing (CTF) regulations. This Anti-Money Laundering and Counter-Terrorism Financing Policy ("Policy") sets out our obligations and procedures to detect, prevent, and report money laundering and terrorism financing activities in connection with the EuroVault Platform.</P>
        <P>This Policy applies to all employees, contractors, directors, and third parties acting on behalf of the Company. Non-compliance with this Policy may result in disciplinary action, contract termination, and referral to competent authorities.</P>
      </Section>

      <Section number="2" title="Regulatory Framework">
        <P>This Policy is designed to comply with the following regulatory frameworks:</P>
        <Ul items={[
          'Directive (EU) 2018/843 — Fifth Anti-Money Laundering Directive (5AMLD)',
          'Directive (EU) 2015/849 — Fourth Anti-Money Laundering Directive (4AMLD)',
          'Regulation (EU) 2015/847 on information accompanying transfers of funds',
          'Cyprus Law 188(I)/2007 on the Prevention and Suppression of Money Laundering',
          'CySEC Circular C374 — AML/CFT Obligations for Regulated Entities',
          'Financial Action Task Force (FATF) Recommendations 2023',
          'EU Sanctions Regulation and applicable OFAC guidance',
        ]} />
      </Section>

      <Section number="3" title="Customer Due Diligence (CDD)">
        <P>The Company applies a risk-based approach to Customer Due Diligence. All users must complete identity verification before accessing certain Platform features. Standard CDD measures include:</P>
        <Ul items={[
          'Collection and verification of full legal name, date of birth, and residential address',
          'Verification of government-issued photo identification (passport, national ID, or driving licence)',
          'Proof of address (utility bill, bank statement, or official correspondence dated within 90 days)',
          'Screening against applicable sanctions lists (OFAC, EU Consolidated List, UN Security Council)',
          'Assessment of the user\'s source of funds and business purpose where required',
        ]} />
        <P>CDD is an ongoing process. We reserve the right to request updated documentation at any time if user risk levels change or if we are unable to maintain satisfactory identification records.</P>
      </Section>

      <Section number="4" title="Enhanced Due Diligence (EDD)">
        <P>Enhanced Due Diligence is applied to higher-risk users, including but not limited to:</P>
        <Ul items={[
          'Politically Exposed Persons (PEPs) and their close associates',
          'Users from high-risk jurisdictions as identified by the FATF or EU',
          'Users with complex corporate structures or significant beneficial ownership arrangements',
          'Transactions or account activity that deviates significantly from expected behaviour',
          'Users for whom standard CDD information is insufficient or cannot be verified',
        ]} />
        <P>EDD measures include additional identity verification, source of wealth documentation, senior management approval, and enhanced ongoing monitoring. Senior management approval is required before establishing or continuing a business relationship with a PEP.</P>
      </Section>

      <Section number="5" title="Transaction Monitoring and Risk Assessment">
        <P>We employ automated and manual transaction monitoring procedures to identify unusual or suspicious activity. Our monitoring systems assess activity against expected user behaviour profiles and flag indicators including:</P>
        <Ul items={[
          'Unusually large or frequent subscription payments inconsistent with user profile',
          'Payments from multiple cards or accounts registered to different identities',
          'Requests for unusual data exports or API access patterns',
          'Activity inconsistent with stated purpose of use',
          'Connection from high-risk IP addresses or use of anonymisation services',
        ]} />
        <P>Our compliance team conducts periodic risk assessments of our customer base and updates risk ratings accordingly. Users classified as high-risk are subject to quarterly reviews.</P>
      </Section>

      <Section number="6" title="Suspicious Activity Reporting">
        <P>Where a member of our team has knowledge or reasonable suspicion that a user or transaction may be connected to money laundering, terrorism financing, or other financial crime, we are legally obligated to file a Suspicious Activity Report (SAR) or Suspicious Transaction Report (STR) with the Cyprus Financial Intelligence Unit (MOKAS) without delay and without tipping off the subject of the report.</P>
        <P>Internal Suspicious Activity Reports must be submitted to our Money Laundering Reporting Officer (MLRO) at {EMAIL}. The MLRO reviews all internal reports and determines whether an external SAR filing is warranted. All SAR filings and related documentation are maintained in confidence.</P>
      </Section>

      <Section number="7" title="Record Keeping">
        <P>We maintain comprehensive records in support of our AML/CTF obligations, including:</P>
        <Ul items={[
          'Customer identification and verification documents: minimum 5 years from account closure',
          'Transaction records: minimum 5 years from the date of the transaction',
          'Suspicious Activity Reports and supporting documentation: minimum 5 years from filing',
          'Compliance training records and policy documentation: minimum 5 years',
          'Risk assessment records: minimum 5 years from completion',
        ]} />
        <P>All records are stored securely in encrypted formats with restricted access. Records may be extended beyond the minimum retention period where required by law or ongoing investigation.</P>
      </Section>

      <Section number="8" title="Sanctions Compliance">
        <P>The Company maintains a zero-tolerance policy toward conducting business with individuals or entities subject to applicable sanctions. We screen all users and counterparties against the following sanctions lists at onboarding and on an ongoing basis:</P>
        <Ul items={[
          'EU Consolidated Sanctions List',
          'OFAC Specially Designated Nationals (SDN) List',
          'UN Security Council Consolidated List',
          'HM Treasury Financial Sanctions List (UK)',
          'Other applicable national and supranational sanctions regimes',
        ]} />
        <P>Any match or potential match is escalated immediately to the MLRO and, where confirmed, results in account suspension and notification to competent authorities.</P>
      </Section>

      <Section number="9" title="Training and Awareness">
        <P>All employees with access to user data or financial systems receive mandatory AML/CTF training upon commencement of employment and annually thereafter. Training covers recognition of money laundering typologies, CDD procedures, reporting obligations, and the consequences of non-compliance.</P>
        <P>This Policy is reviewed at least annually and updated as necessary to reflect changes in applicable law, regulatory guidance, and industry best practices. Significant amendments are communicated to all relevant staff within 14 days of adoption.</P>
      </Section>

      <Section number="10" title="Contact and Reporting">
        <P>If you have concerns about possible money laundering, terrorism financing, or any suspicious activity related to the EuroVault Platform, please contact our Money Laundering Reporting Officer confidentially at {EMAIL}.</P>
        <P>Whistleblowers who report genuine concerns in good faith are protected under applicable law and Company policy. Retaliation against any person for making a good-faith AML/CTF report is strictly prohibited.</P>
      </Section>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
const PAGE_MAP = {
  terms:   { title: 'Terms of Service',              icon: FileText,    Content: TermsContent   },
  privacy: { title: 'Privacy Policy',                icon: Shield,      Content: PrivacyContent },
  refund:  { title: 'Refund Policy',                 icon: RefreshCw,   Content: RefundContent  },
  aml:     { title: 'Anti-Money Laundering Policy',  icon: AlertCircle, Content: AMLContent     },
};

export default function LegalPage() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const page      = PAGE_MAP[slug] || PAGE_MAP['terms'];
  const { title, icon: PageIcon, Content } = page;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug && !PAGE_MAP[slug]) navigate('/legal/terms', { replace: true });
  }, [slug, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'var(--font-body)' }}>

      {/* ── Top bar ── */}
      <div style={{ background: '#0A1628', borderBottom: '3px solid #C9A84C' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo-eurovault.png" alt="EuroVault" style={{ width: 38, height: 38, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 800, color: '#fff' }}>EuroVault</div>
              <div style={{ fontSize: 9, color: '#C9A84C', fontWeight: 700, letterSpacing: '0.12em' }}>DATA ANALYTICS PLATFORM</div>
            </div>
          </a>
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 14px', color: '#CBD5E1', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            <ChevronLeft size={14} />Back
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%)', padding: '44px 28px 36px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, background: 'rgba(201,168,76,0.15)', border: '2px solid rgba(201,168,76,0.35)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <PageIcon size={24} color="#C9A84C" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>
          {COMPANY} &bull; Last Updated: {LAST_UPDATED}
        </p>
      </div>

      {/* ── Layout ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }}>

        {/* Sidebar navigation */}
        <nav style={{ position: 'sticky', top: 24, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '12px 14px', background: '#0A1628', fontSize: 10, fontWeight: 800, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Legal Documents
          </div>
          {NAV_ITEMS.map(({ slug: s, label, icon: Icon }) => {
            const isActive = slug === s;
            return (
              <Link key={s} to={`/legal/${s}`}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#3A86FF' : '#6B7280', background: isActive ? 'rgba(58,134,255,0.06)' : 'transparent', borderLeft: `3px solid ${isActive ? '#3A86FF' : 'transparent'}`, transition: 'all .15s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}>
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ lineHeight: 1.3 }}>{label}</span>
              </Link>
            );
          })}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.5 }}>
              Questions? Contact us at<br />
              <a href={`mailto:${EMAIL}`} style={{ color: '#3A86FF', textDecoration: 'none', fontWeight: 600 }}>{EMAIL}</a>
            </div>
          </div>
        </nav>

        {/* Content */}
        <article style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '36px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minWidth: 0 }}>
          {/* Company info header */}
          <div style={{ padding: '12px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, marginBottom: 28, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Shield size={14} color="#0284C7" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11.5, color: '#0369A1', lineHeight: 1.6 }}>
              <strong>{COMPANY}</strong> &bull; {ADDRESS} &bull; {REG}
            </div>
          </div>

          <Content />

          {/* Bottom navigation */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', marginRight: 4 }}>Related:</span>
            {NAV_ITEMS.filter(n => n.slug !== slug).map(({ slug: s, label }) => (
              <Link key={s} to={`/legal/${s}`}
                style={{ fontSize: 12, color: '#3A86FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                {label} <ExternalLink size={10} />
              </Link>
            ))}
          </div>
        </article>
      </div>

      {/* ── Footer mini ── */}
      <div style={{ background: '#0A1628', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 28px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#4B5563', margin: 0 }}>
          &copy; {new Date().getFullYear()} {COMPANY}. All rights reserved. &bull; {REG}
        </p>
      </div>
    </div>
  );
}

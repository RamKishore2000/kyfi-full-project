import { translate, type KyfiLanguage } from "@/lib/kyfi-i18n";

const runtimeMessageMap: Record<string, string> = {
  "Your vote has been applied.": "search.voteApplied",
  "search.voteApplied": "Your vote has been applied.",
  "Your vote has been removed.": "search.voteRemoved",
  "search.voteRemoved": "Your vote has been removed.",
  "You can update your vote. Removal is not allowed.": "search.voteRemovalLocked",
  "search.voteRemovalLocked": "You can update your vote. Removal is not allowed.",
  "Existing farmer record found.": "search.existingRecordFound",
  "search.existingRecordFound": "Existing farmer record found.",
  "No existing farmer record found.": "search.noRecordFound",
  "search.noRecordFound": "No existing farmer record found.",
  "Farmer status added": "search.farmerStatusAdded",
  "search.farmerStatusAdded": "Farmer status added",
  "Vote failed": "search.unable",
  "search.unable": "Unable to search farmer status",
  "Check failed": "search.unable",
  "Save failed": "common.requestFailed",
  "common.requestFailed": "Request failed",
};

const runtimeTextMapTe: Record<string, string> = {
  "KYFI privacy policy": "KYFI గోప్యతా విధానం",
  "Privacy Policy": "గోప్యతా విధానం",
  "This policy explains how KYFI collects, uses, and protects dealer, farmer, vote, proof image, and subscription information inside the dealer-powered reputation platform.":
    "డీలర్ ఆధారిత ప్రతిష్ట ప్లాట్‌ఫారమ్‌లో డీలర్, రైతు, ఓటు, ప్రూఫ్ ఇమేజ్, మరియు సబ్‌స్క్రిప్షన్ సమాచారాన్ని KYFI ఎలా సేకరిస్తుంది, ఉపయోగిస్తుంది, రక్షిస్తుంది అనే విషయాన్ని ఈ విధానం వివరిస్తుంది.",
  "Dealer account data": "డీలర్ ఖాతా డేటా",
  "Information collected during dealer registration": "డీలర్ రిజిస్ట్రేషన్ సమయంలో సేకరించే సమాచారం",
  "KYFI collects dealer shop name, owner name, mobile number, location, Aadhaar number, GST number, approval status, subscription status, and login activity to create and protect dealer access.":
    "డీలర్ యాక్సెస్‌ను సృష్టించడానికి మరియు రక్షించడానికి KYFI డీలర్ షాప్ పేరు, యజమాని పేరు, మొబైల్ నంబర్, లొకేషన్, ఆధార్ నంబర్, GST నంబర్, ఆమోద స్థితి, సబ్‌స్క్రిప్షన్ స్థితి, మరియు లాగిన్ కార్యకలాపాలను సేకరిస్తుంది.",
  "Farmer records": "రైతు రికార్డులు",
  "Information stored for New Farmers and Old Farmers": "కొత్త రైతులు మరియు పాత రైతుల కోసం నిల్వ చేసే సమాచారం",
  "New Farmer records may include farmer name, mobile number, Aadhaar number, location, and GREEN, YELLOW, or RED payment status. Old Farmer records may include mobile number, location, vote count, proof images, and dealer vote details.":
    "కొత్త రైతు రికార్డుల్లో రైతు పేరు, మొబైల్ నంబర్, ఆధార్ నంబర్, లొకేషన్, మరియు GREEN, YELLOW, లేదా RED చెల్లింపు స్థితి ఉండవచ్చు. పాత రైతు రికార్డుల్లో మొబైల్ నంబర్, లొకేషన్, ఓటు కౌంట్, ప్రూఫ్ ఇమేజ్‌లు, మరియు డీలర్ ఓటు వివరాలు ఉండవచ్చు.",
  "Platform usage": "ప్లాట్‌ఫారమ్ వినియోగం",
  "How KYFI uses dealer and farmer data": "డీలర్ మరియు రైతు డేటాను KYFI ఎలా ఉపయోగిస్తుంది",
  "KYFI uses this data to help dealers search farmer reputation, identify risky Old Farmer records, maintain their own New Farmer records, show vote history, manage subscriptions, and support admin review.":
    "రైతు ప్రతిష్టను శోధించడానికి, ప్రమాదకర పాత రైతు రికార్డులను గుర్తించడానికి, తమ కొత్త రైతు రికార్డులను నిర్వహించడానికి, ఓటు చరిత్రను చూపించడానికి, సబ్‌స్క్రిప్షన్లను నిర్వహించడానికి, మరియు అడ్మిన్ సమీక్షకు సహాయపడటానికి KYFI ఈ డేటాను ఉపయోగిస్తుంది.",
  "Visibility": "కనిపించే సమాచారం",
  "What other dealers can see": "ఇతర డీలర్లు ఏమి చూడగలరు",
  "Approved and subscribed dealers can see relevant farmer reputation information such as old farmer details, vote counts, and vote proof where needed. Sensitive Aadhaar information is masked in the interface wherever possible.":
    "ఆమోదించబడిన మరియు సబ్‌స్క్రిప్షన్ ఉన్న డీలర్లు పాత రైతు వివరాలు, ఓటు కౌంట్‌లు, మరియు అవసరమైన చోట ఓటు ప్రూఫ్ వంటి సంబంధిత రైతు ప్రతిష్ట సమాచారాన్ని చూడగలరు. సాధ్యమైనంత వరకు సున్నితమైన ఆధార్ సమాచారం మాస్క్ చేయబడుతుంది.",
  "Responsibility": "బాధ్యత",
  "Dealer data responsibility": "డీలర్ డేటా బాధ్యత",
  "Dealers must add correct farmer details, upload genuine proof images, and avoid sharing KYFI data outside the platform for harassment, public posting, or unrelated business purposes.":
    "డీలర్లు సరైన రైతు వివరాలను జోడించాలి, నిజమైన ప్రూఫ్ ఇమేజ్‌లను అప్‌లోడ్ చేయాలి, మరియు వేధింపు, పబ్లిక్ పోస్టింగ్, లేదా సంబంధం లేని వ్యాపార అవసరాల కోసం KYFI డేటాను ప్లాట్‌ఫారమ్ బయట పంచకూడదు.",
  "Important": "ముఖ్యమైనది",
  "KYFI supports dealer credit decisions, but each dealer remains responsible for verifying farmer details before giving credit or products.":
    "KYFI డీలర్ క్రెడిట్ నిర్ణయాలకు సహాయపడుతుంది, కానీ క్రెడిట్ లేదా ఉత్పత్తులు ఇవ్వడానికి ముందు రైతు వివరాలను ధృవీకరించడం ప్రతి డీలర్ బాధ్యత.",

  "KYFI usage rules": "KYFI వినియోగ నిబంధనలు",
  "Terms of Use": "వినియోగ నిబంధనలు",
  "These terms explain how dealers, admins, and Super Admins should use KYFI for farmer records, votes, proof images, subscriptions, and account access.":
    "రైతు రికార్డులు, ఓట్లు, ప్రూఫ్ ఇమేజ్‌లు, సబ్‌స్క్రిప్షన్లు, మరియు ఖాతా యాక్సెస్ కోసం డీలర్లు, అడ్మిన్లు, మరియు సూపర్ అడ్మిన్లు KYFIను ఎలా ఉపయోగించాలి అనే విషయాన్ని ఈ నిబంధనలు వివరిస్తాయి.",
  "Dealer access": "డీలర్ యాక్సెస్",
  "Who can use KYFI": "KYFIను ఎవరు ఉపయోగించవచ్చు",
  "KYFI is for pesticide and agri-input dealers who need to check farmer credit reputation before giving credit or products. Dealer accounts must be registered, subscribed, and approved where required.":
    "క్రెడిట్ లేదా ఉత్పత్తులు ఇవ్వడానికి ముందు రైతు క్రెడిట్ ప్రతిష్టను తనిఖీ చేయాల్సిన పురుగుమందులు మరియు అగ్రి ఇన్‌పుట్ డీలర్ల కోసం KYFI రూపొందించబడింది. అవసరమైన చోట డీలర్ ఖాతాలు రిజిస్టర్, సబ్‌స్క్రైబ్, మరియు ఆమోదం పొందాలి.",
  "New Farmer records": "కొత్త రైతు రికార్డులు",
  "How New Farmer status should be used": "కొత్త రైతు స్థితిని ఎలా ఉపయోగించాలి",
  "New Farmer records are maintained by the dealer who added them. GREEN means paid, YELLOW means partial payment, and RED means unpaid. Dealers must use these statuses honestly and only for their own farmer records.":
    "కొత్త రైతు రికార్డులను వాటిని జోడించిన డీలర్ నిర్వహిస్తారు. GREEN అంటే చెల్లించారు, YELLOW అంటే భాగ చెల్లింపు, RED అంటే చెల్లించలేదు. డీలర్లు ఈ స్థితులను నిజాయితీగా మరియు తమ రైతు రికార్డులకే ఉపయోగించాలి.",
  "Old Farmer records": "పాత రైతు రికార్డులు",
  "How Old Farmer reputation records work": "పాత రైతు ప్రతిష్ట రికార్డులు ఎలా పనిచేస్తాయి",
  "Old Farmers are farmers who repeatedly take credit or products from dealers and do not pay properly. Old Farmer records can include vote count, dealer vote details, and proof images to help other dealers avoid risky credit decisions.":
    "డీలర్ల దగ్గర నుంచి పదేపదే క్రెడిట్ లేదా ఉత్పత్తులు తీసుకుని సరిగా చెల్లించని రైతులను పాత రైతులుగా పరిగణిస్తారు. ఇతర డీలర్లు ప్రమాదకర క్రెడిట్ నిర్ణయాలను నివారించేందుకు పాత రైతు రికార్డుల్లో ఓటు కౌంట్, డీలర్ ఓటు వివరాలు, మరియు ప్రూఫ్ ఇమేజ్‌లు ఉండవచ్చు.",
  "Misuse rules": "దుర్వినియోగ నియమాలు",
  "What is not allowed": "ఏవి అనుమతించబడవు",
  "Dealers must not create false farmer records, upload fake proof images, misuse another dealer's data, bypass subscription or approval rules, or use KYFI for harassment or public sharing.":
    "డీలర్లు తప్పుడు రైతు రికార్డులు సృష్టించకూడదు, నకిలీ ప్రూఫ్ ఇమేజ్‌లు అప్‌లోడ్ చేయకూడదు, ఇతర డీలర్ డేటాను దుర్వినియోగం చేయకూడదు, సబ్‌స్క్రిప్షన్ లేదా ఆమోద నియమాలను తప్పించకూడదు, లేదా వేధింపు/పబ్లిక్ షేరింగ్ కోసం KYFIను ఉపయోగించకూడదు.",
  "Limitations": "పరిమితులు",
  "KYFI is not a repayment guarantee": "KYFI తిరిగి చెల్లింపు హామీ కాదు",
  "KYFI provides shared dealer reputation information. It is not a legal recovery service, payment collection service, or guarantee that a farmer will repay credit.":
    "KYFI పంచుకున్న డీలర్ ప్రతిష్ట సమాచారాన్ని అందిస్తుంది. ఇది చట్టపరమైన రికవరీ సేవ, చెల్లింపు కలెక్షన్ సేవ, లేదా రైతు క్రెడిట్ తిరిగి చెల్లిస్తాడనే హామీ కాదు.",
  "Dealer decision": "డీలర్ నిర్ణయం",
  "KYFI helps with reputation checking. The final decision to give credit or products always belongs to the dealer.":
    "KYFI ప్రతిష్ట తనిఖీకి సహాయపడుతుంది. క్రెడిట్ లేదా ఉత్పత్తులు ఇవ్వాలా అనే తుది నిర్ణయం ఎల్లప్పుడూ డీలర్‌దే.",

  "KYFI refund policy": "KYFI రిఫండ్ పాలసీ",
  "Refund Policy": "రిఫండ్ పాలసీ",
  "This policy explains refund rules for KYFI's yearly digital subscription access for dealers.":
    "డీలర్ల కోసం KYFI వార్షిక డిజిటల్ సబ్‌స్క్రిప్షన్ యాక్సెస్‌కు సంబంధించిన రిఫండ్ నియమాలను ఈ పాలసీ వివరిస్తుంది.",
  "Subscription payment": "సబ్‌స్క్రిప్షన్ చెల్లింపు",
  "Yearly digital access fee": "వార్షిక డిజిటల్ యాక్సెస్ ఫీజు",
  "KYFI subscription payments are collected for yearly digital dealer access to farmer search, farmer record management, vote visibility, and related dealer tools.":
    "రైతు శోధన, రైతు రికార్డ్ నిర్వహణ, ఓటు వీక్షణ, మరియు సంబంధిత డీలర్ టూల్స్ కోసం వార్షిక డిజిటల్ డీలర్ యాక్సెస్‌కు KYFI సబ్‌స్క్రిప్షన్ చెల్లింపులు వసూలు చేయబడతాయి.",
  "General rule": "సాధారణ నియమం",
  "Activated subscriptions are non-refundable": "యాక్టివేట్ అయిన సబ్‌స్క్రిప్షన్లు రిఫండ్ చేయబడవు",
  "Once payment is successful and dealer subscription access is activated, the yearly subscription fee is generally non-refundable.":
    "చెల్లింపు విజయవంతమై డీలర్ సబ్‌స్క్రిప్షన్ యాక్సెస్ యాక్టివేట్ అయిన తర్వాత, వార్షిక సబ్‌స్క్రిప్షన్ ఫీజు సాధారణంగా రిఫండ్ చేయబడదు.",
  "Eligible cases": "అర్హమైన సందర్భాలు",
  "When a refund may be reviewed": "రిఫండ్‌ను ఎప్పుడు సమీక్షించవచ్చు",
  "A refund may be considered if payment is deducted but access is not activated, duplicate payment is made for the same dealer account, or KYFI cannot resolve a verified technical access issue.":
    "చెల్లింపు డెబిట్ అయి యాక్సెస్ యాక్టివేట్ కాకపోతే, అదే డీలర్ ఖాతాకు డూప్లికేట్ చెల్లింపు జరిగితే, లేదా ధృవీకరించిన సాంకేతిక యాక్సెస్ సమస్యను KYFI పరిష్కరించలేకపోతే రిఫండ్‌ను పరిశీలించవచ్చు.",
  "Timeline": "సమయరేఖ",
  "Approved refund processing time": "ఆమోదించిన రిఫండ్ ప్రాసెసింగ్ సమయం",
  "If a refund is approved, it will be processed to the original payment method within 7 to 10 working days, depending on bank and payment gateway processing time.":
    "రిఫండ్ ఆమోదించబడితే, బ్యాంక్ మరియు పేమెంట్ గేట్‌వే ప్రాసెసింగ్ సమయాన్ని బట్టి 7 నుండి 10 పని దినాల్లో అసలు చెల్లింపు పద్ధతికి ప్రాసెస్ చేయబడుతుంది.",
  "Misuse": "దుర్వినియోగం",
  "Refunds are not provided for policy violations": "పాలసీ ఉల్లంఘనలకు రిఫండ్ ఇవ్వబడదు",
  "No refund will be provided if the account is suspended for misuse, false farmer records, fake proof images, misleading votes, or violation of KYFI platform rules.":
    "దుర్వినియోగం, తప్పుడు రైతు రికార్డులు, నకిలీ ప్రూఫ్ ఇమేజ్‌లు, తప్పుదారి పట్టించే ఓట్లు, లేదా KYFI ప్లాట్‌ఫారమ్ నియమాల ఉల్లంఘన కారణంగా ఖాతా సస్పెండ్ అయితే రిఫండ్ ఇవ్వబడదు.",

  "KYFI cancellation policy": "KYFI రద్దు పాలసీ",
  "Cancellation Policy": "రద్దు పాలసీ",
  "This policy explains how cancellation and subscription validity work for KYFI yearly digital dealer access.":
    "KYFI వార్షిక డిజిటల్ డీలర్ యాక్సెస్ కోసం రద్దు మరియు సబ్‌స్క్రిప్షన్ చెల్లుబాటు ఎలా పనిచేస్తాయో ఈ పాలసీ వివరిస్తుంది.",
  "Plan type": "ప్లాన్ రకం",
  "KYFI uses a yearly digital subscription": "KYFI వార్షిక డిజిటల్ సబ్‌స్క్రిప్షన్‌ను ఉపయోగిస్తుంది",
  "Dealer access is provided as a yearly digital subscription plan. The plan gives access to KYFI dealer features for the active subscription period.":
    "డీలర్ యాక్సెస్ వార్షిక డిజిటల్ సబ్‌స్క్రిప్షన్ ప్లాన్‌గా అందించబడుతుంది. యాక్టివ్ సబ్‌స్క్రిప్షన్ కాలం వరకు KYFI డీలర్ ఫీచర్లకు యాక్సెస్ ఇస్తుంది.",
  "Cancellation": "రద్దు",
  "Stopping use does not create a partial refund": "వినియోగాన్ని ఆపడం వల్ల భాగ రిఫండ్ రాదు",
  "A dealer may stop using KYFI at any time, but active yearly subscription access cannot be cancelled for a partial refund after activation.":
    "డీలర్ ఎప్పుడైనా KYFI వినియోగాన్ని ఆపవచ్చు, కానీ యాక్టివేషన్ తర్వాత యాక్టివ్ వార్షిక సబ్‌స్క్రిప్షన్ యాక్సెస్‌ను భాగ రిఫండ్ కోసం రద్దు చేయలేరు.",
  "Validity": "చెల్లుబాటు",
  "Access continues until expiry": "గడువు ముగిసే వరకు యాక్సెస్ కొనసాగుతుంది",
  "Subscription access remains valid until the expiry date unless the account is suspended because of misuse, false records, fake proof, or platform rule violations.":
    "దుర్వినియోగం, తప్పుడు రికార్డులు, నకిలీ ప్రూఫ్, లేదా ప్లాట్‌ఫారమ్ నియమాల ఉల్లంఘన కారణంగా ఖాతా సస్పెండ్ కాకపోతే, సబ్‌స్క్రిప్షన్ యాక్సెస్ గడువు తేదీ వరకు చెల్లుబాటులో ఉంటుంది.",
  "Renewal": "పునరుద్ధరణ",
  "Renewal is required after expiry": "గడువు ముగిసిన తర్వాత పునరుద్ధరణ అవసరం",
  "After the subscription expiry date, the dealer must renew the plan to continue using KYFI dealer features.":
    "సబ్‌స్క్రిప్షన్ గడువు ముగిసిన తర్వాత, KYFI డీలర్ ఫీచర్లను కొనసాగించడానికి డీలర్ ప్లాన్‌ను పునరుద్ధరించాలి.",

  "KYFI digital delivery": "KYFI డిజిటల్ డెలివరీ",
  "Digital Service Delivery Policy": "డిజిటల్ సేవ డెలివరీ పాలసీ",
  "This policy explains how KYFI dealer subscription access is delivered digitally after payment.":
    "చెల్లింపు తర్వాత KYFI డీలర్ సబ్‌స్క్రిప్షన్ యాక్సెస్ డిజిటల్‌గా ఎలా అందించబడుతుందో ఈ పాలసీ వివరిస్తుంది.",
  "No shipping": "షిప్పింగ్ లేదు",
  "KYFI is a digital subscription platform": "KYFI ఒక డిజిటల్ సబ్‌స్క్రిప్షన్ ప్లాట్‌ఫారమ్",
  "KYFI does not ship any physical product. Dealer access is provided digitally through the KYFI website and mobile app experience.":
    "KYFI ఎలాంటి భౌతిక ఉత్పత్తిని పంపదు. KYFI వెబ్‌సైట్ మరియు మొబైల్ యాప్ అనుభవం ద్వారా డీలర్ యాక్సెస్ డిజిటల్‌గా అందించబడుతుంది.",
  "Activation": "యాక్టివేషన్",
  "Access is activated after successful payment": "విజయవంతమైన చెల్లింపు తర్వాత యాక్సెస్ యాక్టివేట్ అవుతుంది",
  "After successful payment verification, dealer subscription access is activated digitally for the yearly plan period.":
    "విజయవంతమైన చెల్లింపు ధృవీకరణ తర్వాత, వార్షిక ప్లాన్ కాలానికి డీలర్ సబ్‌స్క్రిప్షన్ యాక్సెస్ డిజిటల్‌గా యాక్టివేట్ అవుతుంది.",
  "Login access": "లాగిన్ యాక్సెస్",
  "Dealers use their registered account": "డీలర్లు తమ రిజిస్టర్ చేసిన ఖాతాను ఉపయోగిస్తారు",
  "Dealers access KYFI using their registered mobile number and login credentials or OTP flow, based on the available login method.":
    "అందుబాటులో ఉన్న లాగిన్ విధానాన్ని బట్టి, డీలర్లు తమ రిజిస్టర్ చేసిన మొబైల్ నంబర్ మరియు లాగిన్ వివరాలు లేదా OTP ఫ్లో ద్వారా KYFIను యాక్సెస్ చేస్తారు.",
  "Delayed activation can be reported": "ఆలస్యమైన యాక్టివేషన్‌ను నివేదించవచ్చు",
  "If payment is successful but access is not activated because of verification or technical delay, the dealer can contact KYFI support with the registered mobile number and payment details.":
    "చెల్లింపు విజయవంతమైనా, ధృవీకరణ లేదా సాంకేతిక ఆలస్యం కారణంగా యాక్సెస్ యాక్టివేట్ కాకపోతే, డీలర్ రిజిస్టర్ చేసిన మొబైల్ నంబర్ మరియు చెల్లింపు వివరాలతో KYFI సపోర్ట్‌ను సంప్రదించవచ్చు.",
  "Digital-only service": "డిజిటల్ సేవ మాత్రమే",
  "No courier, shipping, or physical delivery is involved in KYFI subscription access.":
    "KYFI సబ్‌స్క్రిప్షన్ యాక్సెస్‌లో కొరియర్, షిప్పింగ్, లేదా భౌతిక డెలివరీ ఉండదు.",

  "KYFI support": "KYFI సపోర్ట్",
  "Contact and Support": "సంప్రదింపు మరియు సపోర్ట్",
  "Use these contact details for dealer account, subscription, payment, approval, and platform access support.":
    "డీలర్ ఖాతా, సబ్‌స్క్రిప్షన్, చెల్లింపు, ఆమోదం, మరియు ప్లాట్‌ఫారమ్ యాక్సెస్ సపోర్ట్ కోసం ఈ సంప్రదింపు వివరాలను ఉపయోగించండి.",
  "Email": "ఇమెయిల్",
  "Support email": "సపోర్ట్ ఇమెయిల్",
  "For KYFI account, subscription, payment, approval, or access support, contact smartdealers916@gmail.com.":
    "KYFI ఖాతా, సబ్‌స్క్రిప్షన్, చెల్లింపు, ఆమోదం, లేదా యాక్సెస్ సపోర్ట్ కోసం smartdealers916@gmail.com ను సంప్రదించండి.",
  "Mobile": "మొబైల్",
  "Support mobile number": "సపోర్ట్ మొబైల్ నంబర్",
  "Dealers can contact KYFI support at 8886000815 and should share their registered mobile number for faster checking.":
    "డీలర్లు 8886000815 వద్ద KYFI సపోర్ట్‌ను సంప్రదించవచ్చు మరియు వేగంగా తనిఖీ చేయడానికి తమ రిజిస్టర్ చేసిన మొబైల్ నంబర్‌ను పంచుకోవాలి.",
  "Region": "ప్రాంతం",
  "Current service area": "ప్రస్తుత సేవా ప్రాంతం",
  "KYFI is currently designed for pesticide and agri-input dealers in Andhra Pradesh and Telangana.":
    "KYFI ప్రస్తుతం ఆంధ్రప్రదేశ్ మరియు తెలంగాణలోని పురుగుమందులు మరియు అగ్రి ఇన్‌పుట్ డీలర్ల కోసం రూపొందించబడింది.",
  "Payment help": "చెల్లింపు సహాయం",
  "What to share for payment support": "చెల్లింపు సపోర్ట్ కోసం ఏమి పంచుకోవాలి",
  "For payment or subscription activation issues, share registered mobile number, payment date, payment amount, and transaction or Razorpay payment details if available.":
    "చెల్లింపు లేదా సబ్‌స్క్రిప్షన్ యాక్టివేషన్ సమస్యల కోసం, రిజిస్టర్ చేసిన మొబైల్ నంబర్, చెల్లింపు తేదీ, చెల్లింపు మొత్తం, మరియు అందుబాటులో ఉంటే ట్రాన్సాక్షన్ లేదా Razorpay చెల్లింపు వివరాలు పంచుకోండి.",

  "KYFI subscription": "KYFI సబ్‌స్క్రిప్షన్",
  "Subscription Pricing": "సబ్‌స్క్రిప్షన్ ధర",
  "This page explains how KYFI's yearly dealer subscription price and access period are shown to dealers.":
    "KYFI వార్షిక డీలర్ సబ్‌స్క్రిప్షన్ ధర మరియు యాక్సెస్ కాలం డీలర్లకు ఎలా చూపించబడుతుందో ఈ పేజీ వివరిస్తుంది.",
  "Plan": "ప్లాన్",
  "One Year Plan": "ఒక సంవత్సరం ప్లాన్",
  "KYFI provides yearly digital subscription access for dealers who need farmer search, New Farmer records, Old Farmer records, vote visibility, and account tools.":
    "రైతు శోధన, కొత్త రైతు రికార్డులు, పాత రైతు రికార్డులు, ఓటు వీక్షణ, మరియు ఖాతా టూల్స్ అవసరమైన డీలర్లకు KYFI వార్షిక డిజిటల్ సబ్‌స్క్రిప్షన్ యాక్సెస్ అందిస్తుంది.",
  "Price": "ధర",
  "Final price is shown before payment": "చెల్లింపుకు ముందు తుది ధర చూపించబడుతుంది",
  "The active yearly subscription price is shown on the KYFI subscription section or payment page before the dealer completes payment.":
    "డీలర్ చెల్లింపు పూర్తి చేసే ముందు యాక్టివ్ వార్షిక సబ్‌స్క్రిప్షన్ ధర KYFI సబ్‌స్క్రిప్షన్ సెక్షన్ లేదా పేమెంట్ పేజీలో చూపించబడుతుంది.",
  "Duration": "వ్యవధి",
  "Subscription is valid for one full year": "సబ్‌స్క్రిప్షన్ ఒక పూర్తి సంవత్సరం చెల్లుబాటు అవుతుంది",
  "The yearly plan remains active for one full year from successful subscription activation, unless the account is suspended because of platform misuse.":
    "ప్లాట్‌ఫారమ్ దుర్వినియోగం కారణంగా ఖాతా సస్పెండ్ కాకపోతే, విజయవంతమైన సబ్‌స్క్రిప్షన్ యాక్టివేషన్ నుంచి వార్షిక ప్లాన్ ఒక పూర్తి సంవత్సరం యాక్టివ్‌గా ఉంటుంది.",
  "Access": "యాక్సెస్",
  "Subscription works with dealer approval": "సబ్‌స్క్రిప్షన్ డీలర్ ఆమోదంతో పనిచేస్తుంది",
  "Dealer access is provided after successful payment, subscription activation, and account approval where KYFI admin review is required.":
    "విజయవంతమైన చెల్లింపు, సబ్‌స్క్రిప్షన్ యాక్టివేషన్, మరియు KYFI అడ్మిన్ సమీక్ష అవసరమైన చోట ఖాతా ఆమోదం తర్వాత డీలర్ యాక్సెస్ అందించబడుతుంది.",
};

export function translateRuntimeMessage(message: string, language: KyfiLanguage = "en") {
  const key = runtimeMessageMap[message];
  if (!key) return message;

  if (key === "search.voteRemoved") {
    return language === "te" ? "మీ ఓటు తొలగించబడింది." : "Your vote has been removed.";
  }

  if (key === "search.voteRemovalLocked") {
    return language === "te"
      ? "మీ ఓటును మార్చవచ్చు. తొలగించడం అనుమతించబడదు."
      : "You can update your vote. Removal is not allowed.";
  }

  const translated = translate(language, key);
  return translated === key ? key : translated;
}

export function translateRuntimeText(text: string, language: KyfiLanguage = "en") {
  if (language === "te") {
    const trimmed = text.trim();
    const translated = runtimeTextMapTe[trimmed];
    if (translated) {
      return text.replace(trimmed, translated);
    }
  }

  return translateRuntimeMessage(text, language);
}

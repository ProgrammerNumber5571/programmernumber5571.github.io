import { optimizeMedia } from "../lib/cloudinary.js";

const rawArtistProfiles = {
  "Playboi Carti": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751199/playboiCarti_banner_n8qpjf.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751234/playboiCarti_pfp_fzma49.png",
    merchBanner: 'https://res.cloudinary.com/deroy68n9/image/upload/v1769169960/Logos-Desktop-Carti_e853d832-8fa_f2cl7m.png',
    description: {
      az: "Playboi Carti Atlantadan olan amerikalı reperdir; minimalist ifa tərzi və eksperimental 'rage' səsi ilə tanınır. Die Lit, Whole Lotta Red və MUSIC albomları underground hip-hopun bütöv bir nəslini formalaşdırıb, Opium leybli isə Ken Carson, Destroy Lonely və Homixide Gang-ə ev sahibliyi edir.",
      en: "Playboi Carti is an American rapper from Atlanta known for his minimalist delivery and experimental 'rage' sound. His albums Die Lit, Whole Lotta Red and MUSIC shaped a generation of underground hip-hop, and his Opium label is home to Ken Carson, Destroy Lonely and Homixide Gang.",
      ru: "Playboi Carti — американский рэпер из Атланты, известный минималистичной подачей и экспериментальным 'rage'-звучанием. Его альбомы Die Lit, Whole Lotta Red и MUSIC сформировали целое поколение андеграундного хип-хопа, а его лейбл Opium — дом для Ken Carson, Destroy Lonely и Homixide Gang.",
    },
  },
  "The Weeknd": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751228/theWeeknd_banner_qm2hrs.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751229/theWeeknd_pfp_tjfmnb.jpg",
    description: {
      az: "The Weeknd (Abel Tesfaye) kanadalı müğənni, mahnı müəllifi və prodüserdir; tünd R&B ilə popun qarışığı onu dünyanın ən çox dinlənilən artistlərindən birinə çevirib. After Hours dövrünün 'Blinding Lights' hitindən Hurry Up Tomorrow finalına qədər albomları müasir R&B-ni müəyyən edir.",
      en: "The Weeknd (Abel Tesfaye) is a Canadian singer, songwriter and producer whose blend of dark R&B and pop made him one of the most-streamed artists in the world. From the After Hours era's 'Blinding Lights' to the Hurry Up Tomorrow finale, his albums define modern R&B.",
      ru: "The Weeknd (Эйбел Тесфайе) — канадский певец, автор песен и продюсер, чьё сочетание мрачного R&B и попа сделало его одним из самых прослушиваемых артистов мира. От 'Blinding Lights' эпохи After Hours до финала Hurry Up Tomorrow его альбомы определяют современный R&B.",
    },
  },
  "Kanye West": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751231/kanyeWest_pfp_neut7h.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751231/kanyeWest_pfp_neut7h.png",
    description: {
      az: "Kanye West (Ye) Çikaqodan olan amerikalı reper, prodüser və dizaynerdir; The College Dropout-dan My Beautiful Dark Twisted Fantasy-yə qədərki dövrü hip-hop tarixinin ən güclü seriyalarından sayılır. Soul sempllərindən 808-lərə, gospeldən industrial səsə daimi yenilənməsi populyar musiqinin səsini dəyişib.",
      en: "Kanye West (Ye) is an American rapper, producer and designer from Chicago whose run from The College Dropout to My Beautiful Dark Twisted Fantasy is considered one of the greatest in hip-hop history. His restless reinvention — soul samples, 808s, gospel, industrial — reshaped the sound of popular music.",
      ru: "Kanye West (Ye) — американский рэпер, продюсер и дизайнер из Чикаго; его путь от The College Dropout до My Beautiful Dark Twisted Fantasy считается одним из величайших в истории хип-хопа. Постоянное переизобретение себя — соул-семплы, 808-е, госпел, индастриал — изменило звучание популярной музыки.",
    },
  },
  "Travis Scott": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751788/travisScott_banner_cocq1j.gif",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751232/travisScott_pfp_kqlo5y.jpg"
  },
  "Tyler, The Creator": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751222/tylerTheCreator_banner_c8dga6.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751224/tylerTheCreator_pfp_qeuiu6.jpg"
  },
  "A$AP Rocky": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751197/a_apRocky_banner_pzmdt1.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751686/a_apRocky_vvxx0l.png"
  },
  "Don Toliver": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751225/donToliver_banner_rsazbf.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751230/donToliver_pfp_oijchx.jpg"
  },
  "Young Thug": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751197/youngThug_banner_tpjtio.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751221/youngThug_pfp_njlpm4.jpg"
  },
  "JACKBOYS": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751227/jackboys_banner_d7xom6.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751218/jackboys_pfp_ickl3e.jpg"
  },
  "KIDS SEE GHOSTS": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751219/kidsSeeGhosts_banner_h7r8u3.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751237/kidsSeeGhosts_pfp_mr4qjs.png"
  },
  "¥$": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751216/_banner_mirbpx.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768751223/_pfp_ixfgrj.jpg"
  },
  "Metro Boomin": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768926920/metroBoomin_banner_ejzcij.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927075/metroBoomin_pfp_jouenb.jpg"
  },
  "Kendrick Lamar": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927084/kendrickLamar_banner_l7heux.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927093/kendrickLamar_pfp_lfglqn.png"
  },
  "Ken Carson": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927082/kenCarson_banner_hysazj.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927088/kenCarson_pfp_uhaqem.jpg",
    merchBanner: 'https://res.cloudinary.com/deroy68n9/image/upload/v1769169961/Logos-Desktop-kenCarson_2c683634_gosfgv.png'
  },
  "Destroy Lonely": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927077/destroyLonely_banner_m1br9d.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927091/destroyLonely_pfp_leoelc.jpg",
    merchBanner: 'https://res.cloudinary.com/deroy68n9/image/upload/v1769169960/Logos-Desktop-DL_j37hac.png'
  },
  "Homixide Gang": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927080/hxg_banner_fh8waw.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1768927095/hxg_pfp_zsdk7p.jpg",
    merchBanner: 'https://res.cloudinary.com/deroy68n9/image/upload/v1769169961/Logos-Desktop-HXG_mp3t81.png'
  },
  "Future": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1769094783/future-16x9_larhsy.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1769094783/10000x10000bb_pzcm6y.jpg"
  },
  "Lil Uzi Vert": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1769520514/ibvpwqbmozk41_iffu12.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1769520513/ab6761610000e5eb62c272d76220f2e9dad56704_vuozmn.jpg"
  },
  "JAY-Z": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1769520513/jay-z-spotify_me38jx.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1769520514/ab6761610000e5ebc75afcd5a9027f60eaebb5e4_svg85h.jpg"
  },
  "Yeat": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1773579819/new-yeat-spotify-pfp-v0-410t8rzc_b0uwxh.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1773579819/10000x10000bb_otrove.jpg"
  },
  "Clairo": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1777298267/Clairo1_o4tikd.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1777298265/10000x10000bb_ji53aq.jpg"
  },
  "Sabrina Carpenter": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1777298265/Sabrina_Carpenter_Banner_iagzeh.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1777298265/10000x10000bb_1_plt28v.jpg"
  },
  "Charli xcx": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1777298812/prod-bof-media.s3.eu-west-1.amazonaws_inodd1.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1777298639/10000x10000bb_haaljj.jpg"
  },
  "Latto": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1777305187/latto-artist-you-need-to-know_sb5det.png",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1777305186/ab6761610000e5eba11b0b5c37498f5dddb1bd7b_eacpdz.jpg"
  },
  "Camila Cabello": {
    banner: "https://res.cloudinary.com/deroy68n9/image/upload/v1777305859/Camila-Cabello-press-photo-Bad-Things-Still-1-PC-Drew-Levin-billboard-1548_0_wgph1j.jpg",
    profileImage: "https://res.cloudinary.com/deroy68n9/image/upload/v1777305770/ami-identity-8f1a193175612e1ca5cde75c8e8f331d-2025-04-04T05-22-43.481Z_cropped_ew15sm.png"
  },
  "Lucy Bedroque": {
    banner: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages-prod.dazeddigital.com%2F1350%2Fazure%2Fdazed-prod%2F1440%2F7%2F1447821.jpg&f=1&nofb=1&ipt=2147a5796d9110e9dae48dfb37297d90e6f4658b7aeb93ec9d1bf76997992d10",
    profileImage: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.scdn.co%2Fimage%2Fab6761610000e5eb100cfd4653979ed518fbf28f&f=1&nofb=1&ipt=75785761a099404c3788763751254e2b09bd041afec0bd49f24a49d71e22c32d",
    description: {
      az: "Lucy Bedroque amerikalı musiqiçidir; digicore, pop, EDM və elektro janrlarını bir qədər industrial təsirlərlə birləşdirir. 16 may 2025-ci ildə DeadAir Records etiketi ilə çıxan debüt miksteypi Unmusique tənqidçilər tərəfindən müsbət qarşılandı.",
      en: "Experimental vocalist and producer Lucy Bedroque pulls from microgenres like digikore and hexd to create their blown-out, bright anthems. Debuting in full with 2023’s Sisterhood (under alias Lostrushi), they made their stamp on the underground with 2025’s deconstructive Unmusique.",
      ru: "Lucy Bedroque — американская музыкантка, чья музыка сочетает в себе digicore, поп, EDM и электро с оттенком индастриала. Её дебютный микстейп Unmusique, выпущенный через DeadAir Records 16 мая 2025 года, был положительно воспринят критиками.",
    }
  }
};

export const artistProfiles = optimizeMedia(rawArtistProfiles);
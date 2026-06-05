const STORIES = [
  {
    id:1, title:"Le Long Voyage du Petit Nuage de Coton", emoji:"☁️", thumbBg:"#0f2040",
    scenes:[
      { title:"Le Ciel du Soir", image:"images/scene1_coton_ciel.jpg", imgEmoji:"🌅", imgBg:"linear-gradient(180deg,#1a0e3d,#2d1565,#5c2d8a)",
        text:`Il était une fois un tout petit nuage, blanc et très doux, qui s'appelait <strong>Coton</strong>. Coton habitait tout en haut dans le ciel bleu, mais le soleil commençait à se coucher. Le ciel devenait rose, puis orange, puis un petit peu violet.\n\nCoton sentait ses petites jambes de nuage devenir un peu lourdes. Il bailla très fort... <em>Ouaaaah</em>.`},
      { title:"La Promenade Calme", image:"images/scene2_coton_foret.jpg", imgEmoji:"🌲", imgBg:"linear-gradient(180deg,#0a2010,#153020,#1a4530)",
        text:`Coton décida de faire une petite promenade avant de fermer ses yeux.\n\nIl survola d'abord une <strong>grande forêt</strong>. Les arbres balançaient doucement leurs branches pour dire "chut... tout le monde dort".\n\nIl vit un <strong>petit chat</strong> tout gris, roulé en boule sur un tapis, qui ronronnait doucement : <em>ron-ron... ron-ron...</em>`},
      { title:"La Rencontre avec les Petits Canards", image:"images/scene3_coton_canards.jpg", imgEmoji:"🦆", imgBg:"linear-gradient(180deg,#0a1828,#0f2840,#153858)",
        text:`En glissant tout doucement dans le ciel, Coton arriva au-dessus d'un joli lac tout lisse, comme un grand miroir d'argent.\n\nAu bord de l'eau, une maman canard s'installait dans les roseaux avec ses petits canetons. Maman canard fit un tout petit <em>« coin... »</em> très bas, pour leur dire de passer une bonne nuit. Coton souffla une petite brise tiède sur eux, comme une couverture invisible.`},
      { title:"Le Secret de la Colline aux Moutons", image:"images/scene4_coton_moutons.jpg", imgEmoji:"🐑", imgBg:"linear-gradient(180deg,#101828,#1a2838,#0f1e30)",
        text:`Un peu plus loin, le petit nuage passa au-dessus d'une colline couverte d'herbe tendre. Là-haut, un troupeau de petits moutons blancs s'était rassemblé. De loin, on aurait dit d'autres petits nuages posés sur la terre.\n\nL'un des agneaux leva la tête vers le ciel, vit Coton et lui fit un doux <em>« mêêê... »</em> de bienvenue.`},
      { title:"La Berceuse des Étoiles", image:"images/scene5_coton_lune.jpg", imgEmoji:"✨", imgBg:"linear-gradient(180deg,#050a1a,#0a1028,#0f1840)",
        text:`Le ciel devint alors tout noir, brodé de milliers de petits points brillants. Les étoiles commencèrent à s'allumer une par une, comme de petites bougies magiques.\n\nLa <strong>Lune</strong> lui chuchota :\n\n<blockquote>« Viens te reposer, petit Coton. C'est l'heure de rêver. »</blockquote>\n\nAlors, le petit nuage s'installa confortablement entre deux étoiles et s'endormit profondément.\n\n<em>Fais comme le petit nuage Coton : ferme tes jolis yeux, emmitoufle-toi dans ta couverture, et fais de très beaux rêves.</em>`}
    ]
  },
  {
    id:2, title:"La Petite Étoile qui Cherchait son Doudou", emoji:"⭐", thumbBg:"#1a1040",
    scenes:[
      { title:"La Petite Étoile", image:"images/scene1_etoile_intro.jpg", imgEmoji:"🌟", imgBg:"linear-gradient(180deg,#050a1a,#0f0a30,#1a1050)",
        text:`Il était une fois une <strong>Petite Étoile</strong> qui brillait doucement dans le ciel noir. Elle était très mignonne, mais ce soir-là, elle tournait en rond sur son petit coin de ciel.\n\nElle cherchait quelque chose de très important... son <strong>Doudou-Lune</strong>.`},
      { title:"La Recherche Tranquille", image:"images/scene2_etoile_brise.jpg", imgEmoji:"🌬️", imgBg:"linear-gradient(180deg,#0a1028,#151840,#1a2050)",
        text:`Elle demanda d'abord à la <strong>Brise du Soir</strong>, qui passait par là :\n\n<em>« Petite Brise, as-tu vu mon Doudou-Lune ? »</em>\n\nLa Brise répondit en soufflant un petit air frais : <em>« Pshhh... regarde sous ce gros nuage tout bleu. »</em>\n\nLa Petite Étoile regarda, mais il n'y avait que des petits rêves qui flottaient. Elle continua son chemin, en glissant sur un toboggan de lumière.`},
      { title:"La Rencontre avec la Chouette", image:"images/scene3_etoile_chouette.jpg", imgEmoji:"🦉", imgBg:"linear-gradient(180deg,#0a1020,#101828,#0f2030)",
        text:`Elle croisa une <strong>Maman Chouette</strong> perchée sur une branche d'arbre.\n\n<em>« Madame la Chouette, as-tu vu mon Doudou-Lune ? »</em>\n\nLa Chouette ouvrit un œil, fit un petit <em>« Hou-hou »</em> très calme, et pointa son aile vers un petit panier d'argent au milieu de la Voie Lactée.`},
      { title:"Le Repos", image:"images/scene4_etoile_doudou.jpg", imgEmoji:"🌙", imgBg:"linear-gradient(180deg,#050a18,#0a0f28,#0f1438)",
        text:`Et là, juste à côté d'une petite comète qui dormait, la Petite Étoile trouva son <strong>Doudou-Lune</strong>. Il était tout doux et sentait la poussière de rêve.\n\nElle le serra fort contre son petit cœur de lumière. Elle se blottit dans son petit nid d'étoiles, ferma ses yeux brillants, et commença à briller de moins en moins fort...\n\n<em>Fais comme la Petite Étoile : serre ton doudou, ferme tes petits yeux, et laisse-toi porter par la nuit.</em>`}
    ]
  },
  {
    id:3, title:"Le Petit Lapin aux Oreilles de Soie", emoji:"🐰", thumbBg:"#1a0f30",
    scenes:[
      { title:"La Forêt Silencieuse", image:"images/scene1_pompon_foret.jpg", imgEmoji:"🌿", imgBg:"linear-gradient(180deg,#0a1a10,#101e14,#0f1a18)",
        text:`Il était une fois un petit lapin qui s'appelait <strong>Pompon</strong>. Pompon avait de très longues oreilles, aussi douces que de la soie. C'était la fin de la journée, et la forêt devenait toute silencieuse.\n\nPompon marchait lentement dans l'herbe fraîche. <em>Flip, flap, flip, flap...</em> faisaient ses petites pattes.`},
      { title:"Le Chemin vers le Terrier", image:"images/scene2_pompon_chemin.jpg", imgEmoji:"🐌", imgBg:"linear-gradient(180deg,#0a1810,#0f1e14,#142418)",
        text:`Il croisa un <strong>petit escargot</strong> qui rentrait déjà sa tête dans sa maisonnette pour faire dodo.\n\nIl vit une <strong>coccinelle</strong> qui s'était installée bien au chaud au creux d'une feuille de menthe.\n\nTout le monde se préparait pour la nuit. Le vent chantait une petite chanson dans les feuilles : <em>Sshhh... Sshhh...</em>`},
      { title:"Le Bisou de Maman Lapin", image:"images/scene3_pompon_maman.jpg", imgEmoji:"💕", imgBg:"linear-gradient(180deg,#180a28,#200f35,#1a0f30)",
        text:`Pompon arriva enfin devant son terrier. À l'intérieur, c'était tout douillet, avec de la paille bien sèche et de la mousse très souple. <strong>Maman Lapin</strong> l'attendait.\n\nElle lui fit un petit bisou sur le bout du nez, un bisou tout léger.\n\n<blockquote>« C'est l'heure, mon petit Pompon. Pose tes oreilles, repose tes pattes. »</blockquote>`},
      { title:"Le Sommeil Profond", image:"images/scene4_pompon_dodo.jpg", imgEmoji:"💤", imgBg:"linear-gradient(180deg,#050a18,#0a0f22,#0f1430)",
        text:`Pompon s'allongea de tout son long. Il sentait son petit ventre monter et descendre doucement : <em>on inspire... on expire...</em> Il était bien, il avait chaud.\n\nIl ferma ses petits yeux de lapin, son museau s'arrêta de remuer, et il partit faire de grands rêves de champs de carottes et de papillons multicolores.\n\n<em>C'est le moment de faire comme Pompon : pose ta tête sur l'oreiller, remonte la couverture, et part faire dodo.</em>`}
    ]
  },
  {
    id:4, title:"Le Grand Voyage du Petit Train des Rêves", emoji:"🚂", thumbBg:"#0f1a30",
    scenes:[
      { title:"La Petite Gare Magique", image:"images/scene1_train_gare.jpg", imgEmoji:"🌻", imgBg:"linear-gradient(180deg,#1a1008,#28180a,#201408)",
        text:`Il était une fois, tout au bout du jardin, caché derrière les grands tournesols qui dorment, une petite gare magique. C'est la gare du <strong>Petit Train des Rêves</strong>.\n\nCe train n'est pas comme les autres : il ne fait pas de bruit. Ses roues sont en coton et ses wagons sont faits de gros coussins moelleux.`},
      { title:"La Forêt des Doudous", image:"images/scene2_train_doudous.jpg", imgEmoji:"🧸", imgBg:"linear-gradient(180deg,#180a20,#200f2a,#1a0f28)",
        text:`Le Petit Train démarre... <em>Tchou-tchou...</em> mais un tout petit "tchou-tchou" comme un murmure.\n\nLe premier arrêt, c'est la <strong>Forêt des Doudous</strong>. Tous les ours en peluche, les lapins en tissu s'allongent sur la mousse douce comme du velours.\n\nIls se font des câlins et se disent : <em>« On se retrouve demain pour jouer, maintenant, on se repose. »</em>`},
      { title:"La Rivière de Lait Chaud", image:"images/scene3_train_lait.jpg", imgEmoji:"🥛", imgBg:"linear-gradient(180deg,#0a1020,#0f1530,#0a1828)",
        text:`Le train glisse lentement le long d'une <strong>Rivière de Lait</strong>. L'eau coule doucement comme du sirop de miel.\n\nAu bord de l'eau, des petits chatons boivent une dernière goutte avant de se rouler en boule. Ils sont si calmes qu'on dirait de petites pelotes de laine.\n\nLe Petit Train ralentit encore... il devient de plus en plus silencieux.`},
      { title:"Le Jardin des Étoiles Filantes", image:"images/scene4_train_etoiles.jpg", imgEmoji:"🌠", imgBg:"linear-gradient(180deg,#050a18,#080e28,#0a1235)",
        text:`Enfin, le train arrive dans le wagon le plus beau : celui qui n'a pas de toit. Quand on lève la tête, on voit des millions de petites lumières qui scintillent.\n\nC'est ici que l'on choisit son rêve pour la nuit. Est-ce un rêve de <em>chocolat</em> ? Un rêve de <em>balançoire dans les nuages</em> ? Ou un rêve où l'on <em>vole comme un petit oiseau</em> ?`},
      { title:"Le Terminus : Ton Lit Douillet", image:"images/scene5_train_chambre.jpg", imgEmoji:"🌙", imgBg:"linear-gradient(180deg,#050810,#080c20,#0a1028)",
        text:`Le Petit Train arrive à sa dernière station. Cette station, c'est <strong>ta chambre</strong>.\n\nLa Lune descend un petit rayon d'argent pour te border. Elle vérifie que tes pieds sont bien au chaud sous la couette.\n\n<blockquote>« Tout va bien, tout est calme. Tu peux dormir maintenant. »</blockquote>\n\n<em>Tes petits yeux deviennent très lourds... tes mains se relâchent... et tu t'endors.</em>`}
    ]
  },
  {
    id:5, title:"Le Jardin des Ballons de Pluie", emoji:"🎈", thumbBg:"#1a0828",
    scenes:[
      { title:"L'Arrosoir Magique", image:"images/scene1_gouttelette_intro.jpg", imgEmoji:"🌸", imgBg:"linear-gradient(180deg,#180a20,#220f2a,#1a0830)",
        text:`Il était une fois, dans un pays où les fleurs sont en sucre, un petit arrosoir magique qui s'appelait <strong>Gouttelette</strong>. Gouttelette ne versait pas de l'eau ordinaire, il créait de petits ballons transparents qui flottaient doucement dans l'air.`},
      { title:"Les Ballons Magiques", image:"images/scene2_gouttelette_ballons.jpg", imgEmoji:"🎪", imgBg:"linear-gradient(180deg,#1a0f28,#220f38,#1a1040)",
        text:`Ce soir-là, Gouttelette se promenait dans le jardin. À chaque fois qu'il penchait son petit bec, un nouveau ballon s'envolait :\n\nUn ballon <strong>rose</strong> qui sentait la fraise. Un ballon <strong>bleu</strong> qui faisait le bruit d'une petite clochette. Un ballon <strong>jaune</strong> qui brillait comme un petit soleil de nuit.\n\nLes fleurs du jardin fermaient leurs pétales pour faire dodo.`},
      { title:"Le Nuage-Oreiller", image:"images/scene3_gouttelette_nuage.jpg", imgEmoji:"☁️", imgBg:"linear-gradient(180deg,#0f1028,#141535,#101430)",
        text:`Soudain, un grand nuage tout mou, qui ressemblait à un énorme oreiller, descendit du ciel. Il s'appelait <strong>Dodo-Nuage</strong>.\n\nLes ballons éclatèrent contre lui en faisant un tout petit son : <em>ploc... ploc... ploc...</em>\n\nÀ chaque ballon qui éclatait, une petite poussière d'étoile tombait sur le jardin. Tout devenait encore plus silencieux.`},
      { title:"L'Heure du Repos", image:"images/scene4_gouttelette_repos.jpg", imgEmoji:"💫", imgBg:"linear-gradient(180deg,#050810,#080c1a,#0a1025)",
        text:`Gouttelette, fatigué de sa promenade, alla se ranger sous un grand champignon tout doux.\n\nLe Dodo-Nuage commença à bercer le jardin en bougeant très lentement de gauche à droite. On aurait dit une maman qui berce son bébé.\n\n<blockquote>« Chut... » murmura le vent. « Tout le monde rêve maintenant. »</blockquote>\n\n<em>Et toi aussi, pose ta tête, respire doucement, et laisse le Dodo-Nuage veiller sur toi.</em>`}
    ]
  },
  {
    id:6, title:"Le Doudou Magique du Petit Ourson", emoji:"🐻", thumbBg:"#1a0f10",
    scenes:[
      { title:"La Forêt de Sapins", image:"images/scene1_chocolat_foret.jpg", imgEmoji:"🌲", imgBg:"linear-gradient(180deg,#0a1808,#0f200a,#0a1a10)",
        text:`Il était une fois, au cœur d'une forêt de sapins tout doux, un petit ourson qui s'appelait <strong>Chocolat</strong>. Chocolat avait un pelage brun tout frisé et de grands yeux ronds qui commençaient à se fermer.\n\nLe soleil était déjà parti se coucher derrière la montagne, et le ciel était rempli de petites étoiles dorées. C'était l'heure du dodo.`},
      { title:"La Chasse aux Bisous", image:"images/scene2_chocolat_bisous.jpg", imgEmoji:"💝", imgBg:"linear-gradient(180deg,#1a0818,#220a20,#1a0820)",
        text:`Avant de s'allonger, Chocolat aimait faire un petit rituel avec sa maman.\n\nMaman Ourse lui fit d'abord un bisou sur son <strong>oreille droite</strong>, pour qu'il n'entende que des sons doux. Puis un bisou sur son <strong>oreille gauche</strong>, pour faire fuir les petits bruits de la nuit. Et enfin, un tout petit bisou sur le <strong>bout de son nez</strong>, qui fit doucement rire l'ourson.`},
      { title:"Le Secret du Doudou", image:"images/scene3_chocolat_doudou.jpg", imgEmoji:"🧺", imgBg:"linear-gradient(180deg,#100a28,#180f35,#140a2a)",
        text:`Chocolat attrapa son doudou, un petit mouchoir en tissu bleu qui sentait bon la lavande. Maman Ourse lui chuchota un secret :\n\n<blockquote>« Tu sais, Chocolat, quand tu serres ton doudou très fort et que tu fermes les yeux, il se transforme en un petit tapis volant. Il t'emmène doucement au pays des rêves, là où les rivières sont en chocolat et où les nuages sont en barbe à papa. »</blockquote>`},
      { title:"Le Grand Sommeil", image:"images/scene4_chocolat_sommeil.jpg", imgEmoji:"🌙", imgBg:"linear-gradient(180deg,#050810,#080c1a,#060a18)",
        text:`Le petit ourson s'allongea sur son matelas de mousse bien moelleux. Il serra son doudou tout contre sa joue.\n\nIl commença à respirer très lentement... <em>On inspire par le nez... on souffle par la bouche...</em> Son petit ventre montait et descendait, tout doucement.\n\n<em>Maintenant, c'est ton tour : serre ton doudou, ferme tes jolis yeux, et envole-toi vers le pays des beaux rêves.</em>`}
    ]
  }
];

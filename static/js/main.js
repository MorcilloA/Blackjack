/* Variable contenant les 4 couleurs des cartes */
const colors = ["coeur", "carreau", "pique", "trefle"];
/* Variable contenant les valeurs des cartes en associant le nom en toute lettre de la valeur et le nombre de points qu'elle représente */
const numbers = new Map([
    ["as", 11],
    ["deux", 2],
    ["trois", 3],
    ["quatre", 4],
    ["cinq", 5],
    ["six", 6],
    ["sept", 7],
    ["huit", 8],
    ["neuf", 9],
    ["dix", 10],
    ["valet", 10],
    ["dame", 10],
    ["roi", 10],
]);

const isAuto = false;

/* On initialise la table de jeu */
let table = new Table(2, colors, numbers);

table.initTable();

let current_bet = 0;

/* On récupère les éléments de contenus de la page */
// Eléments liés à la banque
let bank_table = document.querySelector("#bank-table");
let bank_cards = $("#bank-cards");
let bank_score = document.querySelector("#bank-score");
let bank_score_status = $("#bank-score-status");

// Eléments liés au joueur
let player_table = document.querySelector("#player-table");
let player_cards = $("#player-cards");
let player_score = document.querySelector("#player-score");
let player_score_status = $("#player-score-status");
let player_money = document.querySelector("#player-money");
let player_bet = document.querySelector("#player-bet");

// Les parties automatique seront gérées dans un "microcosme" avec ses propres variables et decks seules seront utilisées les fonctions externes de calculs
function launchAutomation(deck_number, starting_money, starting_bet, quitting_money, save_money, tryNumbers) {


    let testsInfos = [];
    let benefs = [];

    for (let i = 0; i < tryNumbers; i++) {

        let saved = 0;
        let autoBet = starting_bet;

        let autoTable = new Table(deck_number, colors, numbers);

        autoTable.setPlayerMoney(starting_money);

        let playable = true;
        while (autoTable.playerMoney >= quitting_money && playable) {
            let hasBotAlreadyLost = false;

            autoTable.initTable();
            autoTable.setBankScore(computeScore(autoTable.bankCards));
            autoTable.setPlayerScore(computeScore(autoTable.playerCards));

            // On boucle pour faire jouer le bot selon les règles de probabilités classiques
            // console.log("Le bot joue !");
            // console.log("score de la banque au service : " + autoTable.bankScore);
            let isBotPlaying = hitOrStand(autoTable);
            while (isBotPlaying) {

                autoTable.playerPicking();
                autoTable.setPlayerScore(computeScore(autoTable.playerCards));

                // Si le bot a brûlé le joueur perd automatiquement, il faut appliquer martingale et lancer le tour suivant
                if (autoTable.playerScore > 21) {
                    hasBotAlreadyLost = true;
                }
                isBotPlaying = hitOrStand(autoTable);

                // console.log("----------------------");
            }

            // On boucle ensuite pour faire jouer la banque
            // console.log("La banque joue");
            let isBankPlaying = hasBotAlreadyLost === true ? false : true;
            while (isBankPlaying) {

                // On la fait piocher
                autoTable.bankPicking();
                autoTable.setBankScore(computeScore(autoTable.bankCards))
                    // console.log("Score de la banque : " + autoTable.bankScore);

                if (autoTable.bankScore >= 17) {
                    isBankPlaying = false;
                }
                // console.log("----------------------");

            }

            let winningInfos = checkForWinner(autoTable);

            switch (winningInfos[0]) {
                case "bot":
                    // console.log("Le bot a gagné");
                    autoTable.setPlayerMoney(autoTable.playerMoney + (autoBet * winningInfos[1]));
                    // console.log(autoTable.playerMoney);
                    autoBet = starting_bet;
                    break;

                case "bank":
                    autoTable.setPlayerMoney(autoTable.playerMoney - (autoBet * winningInfos[1]));
                    // console.log(autoTable.playerMoney);
                    if (checkMartingale(autoTable, autoBet, quitting_money)) {
                        // console.log("La banque a gagné et on fait martingale");
                        autoBet *= 2;
                    } else {
                        // console.log("La banque a gagné mais on ne peut plus faire martingale");
                        playable = false;
                    }
                    break;

                case "tie":
                    // console.log("y a égalité donc rien ne change");
                    // console.log(autoTable.playerMoney);
                    break;
            }

            // Si on a mis de côté suffisamment on retire le surplus et on revient à l'argent de base
            if (autoTable.playerMoney >= (starting_money + save_money)) {
                saved += save_money;
                autoTable.setPlayerMoney(autoTable.playerMoney - save_money);
            }

            autoTable.checkDecksFilling();
            autoTable.resetTable();


        }



        // console.log(autoTable.moneyEvolution);
        // console.log(Math.max(autoTable.moneyEvolution));
        // console.log(`argent au départ : ${starting_money} `);
        // console.log(`argent au dernier moment : ${autoTable.playerMoney} `);
        // console.log(`argent sauvé : ${saved} `);
        // console.log(`benef : ${(autoTable.playerMoney - starting_money) + saved} `);
        // console.log(`argent en sortie : ${saved + autoTable.playerMoney}`);


        // benefs.push((autoTable.playerMoney - starting_money) + saved);
        benefs.push((autoTable.playerMoney + saved) - starting_money);


    }

    let meanBenef = 0
    let positiveBenefs = 0
    let negativeBenefs = 0
    let nullBenefs = 0
    benefs.forEach(benef => {
        meanBenef += benef;
        if (benef > 0) {
            positiveBenefs++;
        } else if (benef < 0) {
            negativeBenefs++;
        } else {
            nullBenefs++;
        }
    });
    meanBenef = meanBenef / benefs.length

    testsInfos.push({
        maxBenef: Math.round(Math.max.apply(Math, benefs) * 100) / 100, // Le bénéfice maximum présent dans le tableau
        minBenef: Math.round(Math.min.apply(Math, benefs) * 100) / 100, // Le bénéfice minimum présent dans le tableau
        meanBenef: Math.round(meanBenef * 100) / 100, // Le bénéfice moyen
        positivePercent: Math.round((positiveBenefs * 100 / benefs.length) * 100) / 100,
        negativePercent: Math.round((negativeBenefs * 100 / benefs.length) * 100) / 100,
        nullPercent: Math.round((nullBenefs * 100 / benefs.length) * 100) / 100,
        benefs // La liste des bénéfices réalisés
    });

    console.log(testsInfos);


    Swal.fire({
        title: "Résultats des parties automatiques",
        html: `
            <p>Bénéfice maximum : ${testsInfos[0]["maxBenef"]}€</p>
            <p>Bénéfice minimum : ${testsInfos[0]["minBenef"]}€</p>
            <p>Bénéfice moyen : ${testsInfos[0]["meanBenef"]}€</p>
            <p>Pourcentage de positifs : ${testsInfos[0]["positivePercent"]}%</p>
            <p>Pourcentage de négatifs : ${testsInfos[0]["negativePercent"]}%</p>
            <p>Pourcentage de null : ${testsInfos[0]["nullPercent"]}%</p>
            <button class="btn btn-success" title="Relancer avec les mêmes paramètres" id="again-btn">Relancer</button>
        `,
        showConfirmButton: false,
        didRender: () => {
            $("#again-btn").on("click", () => {
                launchAutomation(deck_number, starting_money, starting_bet, quitting_money, save_money, tryNumbers);
            })
        }
    });



}


// Fonction destinée aux parties automatiques pour retourner qui a gagné et quel est le multiplicateur
function checkForWinner(autoTable) {
    // Si la banque gagne on retourne "bank"; Si c'est le boton retourne "bot"; Si y a égalité on retourne "tie"

    // Le retour est sous la forme d'un tableau qui contient le gagnant et le multiplicateur a appliquer sur la mise

    // Le bot a brûlé
    if (autoTable.playerScore > 21) {
        return ["bank", 1];
    }

    // La banque a brûlé
    if (autoTable.bankScore > 21) {
        return ["bot", 1];
    }

    // Le bot a fait BJ et la banque aussi
    if ((autoTable.playerScore == 21 && autoTable.playerCards.length == 2) && (autoTable.bankScore == 21 && autoTable.bankCards.length == 2)) {
        return ["tie"];
    } else if ((autoTable.playerScore == 21 && autoTable.playerCards.length == 2) && !(autoTable.bankScore == 21 && autoTable.bankCards.length == 2)) { // Sinon le bot a fait BJ et pas la banque
        return ["bot", 1.5];
    } else if (!(autoTable.playerScore == 21 && autoTable.playerCards.length == 2) && (autoTable.bankScore == 21 && autoTable.bankCards.length == 2)) { // Sinon la banque a fait BJ et pas le bot
        return ["bank", 1];
    }

    // Le bot a plus que la banque
    if (autoTable.playerScore > autoTable.bankScore) {
        return ["bot", 1];
    }

    // La banque a plus que le bot
    if (autoTable.playerScore < autoTable.bankScore) {
        return ["bank", 1];
    }

    // La banque et le bot sont à égalité
    if (autoTable.playerScore == autoTable.bankScore) {
        return ["tie"];
    }
}

// Fonction destinée aux parties automatiques pour voir s'il est possible pour le bot d'appliquer martingale sans passer sous sa limite
function checkMartingale(autoTable, current_bet, quitting_money) {
    if (autoTable.playerMoney - (current_bet * 2) >= quitting_money) {
        return true
    } else {
        return false
    }
}

// Fonction destinée aux parties automatiques pour définir si le bot tire une carte ou s'arrête
//     Possible de l'étendre pour fournir un conseil au joueur dans une partie "normale"
// La fonction retournera true si on pioche et false si on s'arrête
function hitOrStand(autoTable) {
    // console.log("Score du bot : " + autoTable.playerScore);

    // Si le bot a jusqu'à 11 inclus on tire une nouvelle carte à tous les coups
    if (autoTable.playerScore <= 11) {
        // console.log("Le bot tire une carte");
        return true;
    }

    // Si le bot a 12
    if (autoTable.playerScore == 12) {
        // Si la banque a entre 4 et 6 inclus on s'arrête
        if (autoTable.bankScore >= 4 && autoTable.bankScore <= 6) {
            // console.log("Le bot s'arrête");
            return false;
        } else { // Sinon le bot tire une carte
            // console.log("Le bot tire une carte");
            return true;
        }
    }

    // Si le bot a entre 13 et 16 et que la banque a jusqu'à 6 inclu
    if (autoTable.playerScore > 12 && autoTable.playerScore < 17) {
        if (autoTable.bankScore < 7) {
            // console.log("Le bot s'arrête");
            return false;
        } else {
            // console.log("Le bot tire une carte");
            return true;
        }
    }

    if (autoTable.playerScore >= 17) {
        // console.log("Le bot s'arrête");
        return false;
    }

}

function testAce(score) {
    if (score + 11 > 21) {
        return 1;
    } else {
        return 11;
    }
}

function askForBet() {
    Swal.fire({
        title: "Combien souhaitez-vous miser ?",
        html: `
            <input type="number" id="bet-money" value="">
            <div id="bet-error" class="mt-3"></div>
            <button id="bet-btn" class="btn btn-success mt-3">Miser</button>
        `,
        didRender: () => {
            $("#bet-btn").on("click", () => {
                if ($("#bet-money").val() == 0) {
                    $("#bet-error").text("Vous ne pouvez pas miser 0")
                } else if (parseInt($("#bet-money").val()) > table.playerMoney) {
                    $("#bet-error").text("Vous ne pouvez pas miser plus que " + table.playerMoney);
                } else {
                    current_bet = $("#bet-money").val();
                    table.setPlayerMoney(table.playerMoney - current_bet);
                    updateBet();
                    updateMoney();
                    updateBank();
                    updatePlayer();
                    Swal.close();
                }
            })
        },
        showConfirmButton: false
    })
}

function computeScore(hand) {
    let score = 0;
    hand.sort((a, b) => a.valueInt - b.valueInt);
    hand.forEach(card => {
        if (card.valueInt == 11) {
            score += testAce(score);
        } else {
            score += card.valueInt;
        }
    });
    return score;
}


function updateBank() {
    bank_cards.empty();
    bank_score.textContent = 0;
    table.bankCards.forEach(card => {
        let image = document.createElement("img")
        image.setAttribute("src", `/images/cards/${card.valueStr}-${card.color}.png`)
        bank_cards.append(image)

    });

    let newScore = computeScore(table.bankCards);
    table.setBankScore(newScore);

    if (table.bankScore > 21) {

        bank_score.textContent = table.bankScore;
        if (!isAuto) {
            bank_score_status.textContent = "BUST !"
        }
        Swal.fire({
            title: '<p class="text-success">GAGN\u00c9 !</p>',
            timer: 1500,
            timerProgressBar: true,
            icon: "success",
            showConfirmButton: false,
            allowOutsideClick: false
        })

        table.setPlayerMoney(table.playerMoney + (current_bet * 2))
        updateMoney()

        current_bet = 0;
        updateBet();

    } else if (table.bankScore == 21 && table.bankCards.length == 2) {

        bank_score.textContent = table.bankScore;

        if (!isAuto) {
            bank_score_status.textContent = "BLACKJACK !"
        }

        if (table.playerScore == 21 && table.playerCards.length == 2) {
            // Le joueur a déjà un BJ donc c'est une égalité
            table.setPlayerMoney(parseInt(table.playerMoney) + parseInt(current_bet))

            Swal.fire({
                title: '<p class="text-info">\u00c9GALIT\u00c9 !</p>',
                timer: 1500,
                timerProgressBar: true,
                icon: "info",
                showConfirmButton: false,
                allowOutsideClick: false
            })
        } else {
            // En fait les casinos ne prennent pas la moitié de la mise en plus quand il y a un BJ
            // table.setPlayerMoney(table.playerMoney - (current_bet * 0.5))
            Swal.fire({
                title: '<p class="text-danger">PERDU !</p>',
                timer: 1500,
                timerProgressBar: true,
                icon: "error",
                showConfirmButton: false,
                allowOutsideClick: false
            })
        }

        updateMoney()

        current_bet = 0;
        updateBet();

    } else {
        bank_score.textContent = table.bankScore
    }
}

function updateMoney() {
    player_money.textContent = table.playerMoney;
}

function updateBet() {
    player_bet.textContent = current_bet;
}

function updatePlayer() {

    player_cards.empty();
    player_score.textContent = 0;
    table.playerCards.forEach(card => {
        let image = document.createElement("img")
        image.setAttribute("src", `/images/cards/${card.valueStr}-${card.color}.png`)
        player_cards.append(image);
    });

    let newScore = computeScore(table.playerCards);
    table.setPlayerScore(newScore);

    if (table.playerScore > 21) {
        player_score.textContent = table.playerScore;

        if (!isAuto) {
            player_score_status.text(`BUST !`)
        }
        Swal.fire({
            title: '<p class="text-danger">PERDU !</p>',
            timer: 1500,
            timerProgressBar: true,
            icon: "error",
            showConfirmButton: false,
            allowOutsideClick: false
        })

        current_bet = 0;
        updateBet();

        $("#hit-btn").hide();
        $("#stand-btn").hide();
        $("#next-btn").show();

    } else if (table.playerScore == 21 && table.playerCards.length == 2) {
        player_score.textContent = table.playerScore;
        if (!isAuto) {
            player_score_status.text("BLACKJACK !");
        }
    } else {
        player_score.textContent = table.playerScore;
    }

}

$(() => {
    // Par défaut on cache le bouton
    $("#next-btn").hide()

    Swal.fire({
        title: "Avec combien d'argent voulez-vous commencer ?",
        html: `
            <input type="number" id="starting-money" value="200">
        `,
        preConfirm: () => {
            table.setPlayerMoney($("#starting-money").val());
            updateMoney();
            askForBet();
        }
    })

    // Au click sur le bouton HIT
    $("#hit-btn").on("click", (e) => {
        // On fait piocher une carte au joueur
        table.playerPicking();
        // On met à jour l'affichage des cartes et du score 
        updatePlayer();

    })

    // Au click sur le bouton STAND
    $("#stand-btn").on("click", (e) => {

        // On fait disparaître les boutons HIT et STAND
        $("#hit-btn").hide();
        $("#stand-btn").hide();

        // On fait jouer la banque selon les règles
        let bankPlays = true;

        // Tant que la banque est censé jouer, on boucle
        while (bankPlays) {

            // On la fait piocher
            table.bankPicking();
            // On met à jour l'affichage et les scores
            updateBank();

            if (table.bankScore >= 17) {
                bankPlays = false;
            }

        }

        // Une fois que la banque a fini de jouer, on regarde qui a gagné
        if (table.playerScore == 21 && table.playerCards.length == 2) { // Si on est là c'est que la banque a pas fait BJ
            Swal.fire({
                title: '<p class="text-success">GAGN\u00c9 !</p>',
                timer: 1500,
                timerProgressBar: true,
                icon: "success",
                showConfirmButton: false,
                allowOutsideClick: false
            })
            table.setPlayerMoney(table.playerMoney + (current_bet * 2.5))
            updateMoney()

            current_bet = 0;
            updateBet();
            $("#next-btn").show();
        }
        if ((table.bankScore < 21 || (table.bankScore == 21 && table.bankCards.length > 2)) && table.bankScore > table.playerScore) { // La banque a plus que le joueur
            Swal.fire({
                title: '<p class="text-danger">PERDU !</p>',
                timer: 1500,
                timerProgressBar: true,
                icon: "error",
                showConfirmButton: false,
                allowOutsideClick: false
            })
            current_bet = 0;
            updateBet();
        } else if ((table.bankScore < 21 || (table.bankScore == 21 && table.bankCards.length > 2)) && table.bankScore < table.playerScore) { // La banque a moins que le joueur
            Swal.fire({
                title: '<p class="text-success">GAGN\u00c9 !</p>',
                timer: 1500,
                timerProgressBar: true,
                icon: "success",
                showConfirmButton: false,
                allowOutsideClick: false
            })

            table.setPlayerMoney(table.playerMoney + (current_bet * 2));
            updateMoney();

            current_bet = 0;
            updateBet();
        } else if ((table.bankScore < 21 || (table.bankScore == 21 && table.bankCards.length > 2)) && table.bankScore == table.playerScore && (table.playerScore < 21 || (table.playerScore == 21 && table.playerCards.length > 2))) { // La banque est à égalité avec le joueur
            Swal.fire({
                title: '<p class="text-info">\u00c9GALIT\u00c9 !</p>',
                timer: 1500,
                timerProgressBar: true,
                icon: "info",
                showConfirmButton: false,
                allowOutsideClick: false
            })

            table.setPlayerMoney(parseInt(table.playerMoney) + parseInt(current_bet));
            updateMoney();

            current_bet = 0;
            updateBet();
        }

        $("#next-btn").show();
    })

    // Au click sur le bouton NEXT TURN
    $("#next-btn").on("click", (e) => {

        // On regarde s'il faut rebattre les decks de cartes    
        table.checkDecksFilling();

        table.resetTable();
        table.initTable();
        askForBet();
        bank_score_status.text("")
        player_score_status.text("")
        $("#hit-btn").show();
        $("#stand-btn").show();
        $("#next-btn").hide();
    })

    // Au click sur le bouton AUTOMATISER
    $("#auto-btn").on("click", (e) => {
        Swal.fire({
            title: "Quels seront les paramètres de l'automatisation",
            html: `
            <label for="deck-number">Combien de paquets de cartes sont en jeu ?*</label>
            <input class="form-control" type="number" id="deck-number">
            <label for="starting-money">Avec combien le bot commencera ?*</label>
            <input class="form-control" type="number" id="starting-money">
            <label for="starting-bet">Quelle sera la mise initiale ?*</label>
            <input class="form-control" type="number" id="starting-bet">
            <label for="quitting-money">En-dessous de quelle somme le bot ne devra pas descendre ?</label>
            <input class="form-control" type="number" id="quitting-money">
            <label for="save-money">Tous les combien le bot mettra de côté ? <small>(laisser vide pour ne pas mettre de côté)</small></label>
            <input class="form-control" type="number" id="save-money">
            <label for="try-number">Combien de parties doivents être jouées ?*</label>
            <input class="form-control" type="number" id="try-number" value="1">
            <div id="automate-error" class="mt-3"></div>
            <button class="btn btn-success mt-3" id="validate-btn">Valider</button>
            `,
            showConfirmButton: false,
            width: "750px",
            didRender: () => {
                $("#validate-btn").on("click", () => {
                    let isError = false;
                    $("#automate-error").empty();
                    if (!parseInt($("#starting-money").val()) || !parseInt($("#starting-bet").val()) || !parseInt($("#try-number").val())) {
                        $("#automate-error").append("<p>Vous devez remplir les champs avec un '*'</p>")
                        isError = true;
                    }
                    if (parseInt($("#deck-number").val()) <= 0 || parseInt($("#starting-money").val()) <= 0 || parseInt($("#starting-bet").val()) <= 0) {
                        $("#automate-error").append("<p>Vous ne pouvez pas entrer de valeur négatives ou égale à 0 dans les champs obligatoires</p>")
                        isError = true;
                    }
                    if (parseInt($("#quitting-money").val()) < 0) {
                        $("#automate-error").append("<p>La valeur à laquelle le bot quitte la table ne peut pas être négative</p>")
                        isError = true;
                    }
                    if (parseInt($("#save-money").val()) < 0) {
                        $("#automate-error").append("<p>La valeur à laquelle le bot met de côté ne peut pas être négative</p>")
                        isError = true;
                    }
                    if (parseInt($("#starting-bet").val()) > parseInt($("#starting-money").val())) {
                        $("#automate-error").append("<p>La mise initiale ne peut pas être supérieure au total d'argent</p>")
                        isError = true;
                    }
                    if (parseInt($("#quitting-money").val()) > parseInt($("#starting-money").val())) {
                        $("#automate-error").append("<p>La limite à laquelle le bot quitte le jeu ne peut pas être supérieure au total d'argent</p>")
                        isError = true;
                    }

                    if (!isError) {
                        console.log("tout est bon");
                        launchAutomation(parseInt($("#deck-number").val()), parseInt($("#starting-money").val()), parseInt($("#starting-bet").val()), parseInt($("#quitting-money").val()), parseInt($("#save-money").val()), parseInt($("#try-number").val()));
                        // Swal.close();
                    }
                })
            }

        })
    })
})
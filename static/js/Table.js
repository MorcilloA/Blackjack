class Table {

    // constructor(decks, usedCards) {
    constructor(deckNumber, colors, numbers) {

        this.colors = colors;
        this.numbers = numbers;
        this.deckNumber = deckNumber;
        this.decks = new Array();
        for (let i = 0; i < deckNumber; i++) {
            this.decks.push(new Deck(colors, numbers));
        }
        this.usedCards = new Deck(false, false, true);
        this.playerCards = new Array();
        this.bankCards = new Array();
        this.moneyEvolution = new Array();
        this.playerScore = 0;
        this.bankScore = 0;
        this.playerMoney = 0
    }

    initTable() {
        this.playerPicking();
        this.bankPicking();
        this.playerPicking();
    }

    resetTable() {
        this.playerCards = new Array();
        this.bankCards = new Array();
        this.setPlayerScore(0);
        this.setBankScore(0);
    }

    picking() {
        let chosenDeck = Math.floor(Math.random() * this.decks.length);
        let pickedCard = this.decks[chosenDeck].pickCard();

        this.usedCards.addCard(pickedCard[0]);

        return pickedCard[0];
    }

    playerPicking() {
        this.playerCards.push(this.picking());
        return this.playerCards;
    }

    bankPicking() {
        this.bankCards.push(this.picking());
        return this.bankCards;
    }

    setPlayerScore(score) {
        this.playerScore = score;
    }

    setBankScore(score) {
        this.bankScore = score;
    }

    setPlayerMoney(newSold) {
        this.moneyEvolution.push(newSold);
        this.playerMoney = newSold;
    }

    resetDecks() {
        this.usedCards = new Deck(false, false, true);
        this.decks = new Array();
        for (let i = 0; i < this.deckNumber; i++) {
            this.decks.push(new Deck(this.colors, this.numbers));
        }
    }

    checkDecksFilling() {
        let totalCards = 52 * this.decks.length;

        if (this.usedCards.cards.length >= (totalCards * 0.5)) { // Si au moins la moitié des cartes ont déjà été utilisées
            console.log("Les paquets ont été rebattus");
            this.resetDecks();
        }
    }

}
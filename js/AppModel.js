;
'use strict';

var AppModel = function() {
    this.m; // ����� ����� �� ����������� (����� �������)
    this.n; // ����� ������ �� ��������� (����� ������)
    this.size = 15; // ������ ���� (15�15 �����)
    this.who; // ���������� ���������� - ��� ������ �����: true - X, false - O
    this.matrix; // ������� �������� ���� 15�15. 0 - ��������� ������, 1 - �������, 2 - �����
    this.freeCells; // ���������� ��������� �����. � ������ ������ ���� = 225
    this.hashStep; // ���-������ ������������� �����
    this.playing; // True - ���� � �������� ���� (������������ ����� ������� �� ���� � �.�.)
    this.winLine; // ���������� �������� ����� 
    this.prePattern = [// ������� ���������� ������ � �� ����. � � ���������� ���������� �� ������� (1) ��� ����� (0), 0 - ��������� ������
        {s: 'xxxxx', w: 99999}, // ���� � ��� (��������� ���������� �����)
        {s: '0xxxx0', w: 7000}, // �������� ��������
        {s: '0xxxx', w: 4000}, // �������� ��������
        {s: 'xxxx0', w: 4000},
        {s: '0x0xxx', w: 2000},
        {s: '0xx0xx', w: 2000},
        {s: '0xxx0x', w: 2000},
        {s: 'xxx0x0', w: 2000},
        {s: 'xx0xx0', w: 2000},
        {s: 'x0xxx0', w: 2000},
        {s: '0xxx0', w: 3000},
        {s: '0xxx', w: 1500},
        {s: 'xxx0', w: 1500},
        {s: '0xx0x', w: 800},
        {s: '0x0xx', w: 800},
        {s: 'xx0x0', w: 800},
        {s: 'x0xx0', w: 800},
        {s: '0xx0', w: 200}
    ];
    this.pattern = [[], [], []]; // ������ �������� ��� � � 0, ������������ �� ���������� ��������
    this.patternWin = [0, /(1){5}/, /(2){5}/, /[01]*7[01]*/, /[02]*7[02]*/]; // ������ ���������� �������� [1] � [2] � ������ ���������� ����������� ��������� 5 � ��� 
    this.directions = []; // ����������� ������� ������������� �����
    this.step = 0; // ������� ����� ����

    this.init = function() {
        var s;
        var a;
        var l;
        var target = 'x';
        var pos;
        for (var i in this.prePattern) // ���������� ������� �������� ���������� ����� ��� ��������� (1) � ������� (2)
        {
            s = this.prePattern[i].s;
            pos = -1;
            a = [];
            while ((pos = s.indexOf(target, pos + 1)) !== -1) {
                a[a.length] = s.substr(0, pos) + '7' + s.substr(pos + 1);
            }
            s = a.join('|');

            l = this.pattern[0].length;
            this.pattern[0][l] = this.prePattern[i].w;              // ���� ��������
            this.pattern[1][l] = new RegExp(s.replace(/x/g, '1'));  // ������� ��� �, �������� 01110 - �������� ��������
            this.pattern[2][l] = new RegExp(s.replace(/x/g, '2'));  // ���������� ��� 0 - 022220

        }
        for (var n = -2; n <= 2; n++) // ����������� ������� ������������� ����� (� ������� 2 ������)  
        {                             // � ��������� ����������� ����� (������������ ��� ������� ������ �����, ���� �� �������� �������) 
            for (var m = -2; m <= 2; m++)
            {
                if (n === 0 && m === 0)
                    continue;
                if (Math.abs(n) <= 1 && Math.abs(m) <= 1)
                    this.directions.push({n: n, m: m, w: 3});
                else if (Math.abs(n) === Math.abs(m) || n * m === 0)
                    this.directions.push({n: n, m: m, w: 2});
                else
                    this.directions.push({n: n, m: m, w: 1});
            }
        }
    };

    this.setStartData = function(a) { // ��������� ��������� ��� ������ ����� ����
        this.who = true;
        this.matrix = [];
        this.winLine = [];
        this.hashStep = {7: {7: {sum: 0, attack: 1, defence: 0, attackPattern: 0, defencePattern: 0}}}; // ������ ���, ���� �� ������ �� �
        this.freeCells = this.size * this.size;
        for (var n = 0; n < this.size; n++) {
            this.matrix[n] = [];
            for (var m = 0; m < this.size; m++) {
                this.matrix[n][m] = 0;
            }
        }
        this.step = 0;
        this.playing = true;
        if (a === 2)
            console.log('New Game! X - AI, O - user');
        else
            console.log('New Game! X - user, O - AI');
    };

    this.setNM = function(a) { // ��������� ��������� �������� ���� 
        this.n = a.n;
        this.m = a.m;
    };

    this.emptyCell = function() { // �������� ������ �� ����������� ��� ����
        return this.matrix[this.n][this.m] === 0;
    };

    this.moveUser = function() { // ��� ������������
        this.playing = false;    // ��������� �������, ���� ���� ������
        return this.move(this.n, this.m, false);
    };

    this.moveAI = function() { // ��� ��
        this.playing = false;
        var n, m;
        var max = 0;
        this.calculateHashMovePattern(); // ������ ����� �� �������� �������� �����
        for (n in this.hashStep)         // ����� ���� ������� ���� 
            for (m in this.hashStep[n])
                if (this.hashStep[n][m].sum > max)
                    max = this.hashStep[n][m].sum;
        var goodmoves = [];
        for (n in this.hashStep)         // ����� ������ ����� (���� �� ���������)
            for (m in this.hashStep[n])
                if (this.hashStep[n][m].sum === max) {
                    goodmoves[goodmoves.length] = {n: parseInt(n), m: parseInt(m)};
                }
        var movenow = goodmoves[getRandomInt(0, goodmoves.length - 1)]; // ����� ���� ��������� �������, ���� ��������� ����� �� �����
        this.n = movenow.n;
        this.m = movenow.m;
        return this.move(this.n, this.m, true);
    };

    this.move = function(n, m, aiStep) { // ��� (�� ��� ������������)
        if (this.hashStep[n] && this.hashStep[n][m])
            delete this.hashStep[n][m];  // ���� ���� ���� ���� � ������� �������������� �����, �� ���� ��������� �� ����
        this.matrix[n][m] = 2 - this.who; // ���������� ���� � ������� ����� ����
        this.who = !this.who; // ������� ���� �� � � �, �� � � �
        this.freeCells--;
        var t = this.matrix[this.n][this.m]; // ����� ���� �������� �� ������� � ���������� ����� ����: ����� 5 � ��� �� 4 ������������ | � / \
        var s = ['', '', '', ''];
        var nT = Math.min(this.n, 4);
        var nR = Math.min(this.size - this.m - 1, 4);
        var nB = Math.min(this.size - this.n - 1, 4);
        var nL = Math.min(this.m, 4);
        for (var j = this.n - nT; j <= this.n + nB; j++)
            s[0] += this.matrix[j][this.m];
        for (var i = this.m - nL; i <= this.m + nR; i++)
            s[1] += this.matrix[this.n][i];
        for (var i = -Math.min(nT, nL); i <= Math.min(nR, nB); i++)
            s[2] += this.matrix[this.n + i][this.m + i];
        for (var i = -Math.min(nB, nL); i <= Math.min(nR, nT); i++)
            s[3] += this.matrix[this.n - i][this.m + i];
        var k;
        if ((k = s[0].search(this.patternWin[t])) >= 0)
            this.winLine = [this.m, this.n - nT + k, this.m, this.n - nT + k + 4];
        else if ((k = s[1].search(this.patternWin[t])) >= 0)
            this.winLine = [this.m - nL + k, this.n, this.m - nL + k + 4, this.n];
        else if ((k = s[2].search(this.patternWin[t])) >= 0)
            this.winLine = [this.m - Math.min(nT, nL) + k, this.n - Math.min(nT, nL) + k, this.m - Math.min(nT, nL) + k + 4, this.n - Math.min(nT, nL) + k + 4];
        else if ((k = s[3].search(this.patternWin[t])) >= 0)
            this.winLine = [this.m - Math.min(nB, nL) + k, this.n + Math.min(nB, nL) - k, this.m - Math.min(nB, nL) + k + 4, this.n + Math.min(nB, nL) - k - 4, -1];
        this.playing = (this.freeCells !== 0 && this.winLine.length === 0); // �������� �� ��������� ���� (������ ��� ��� ��������� �����)
        if (this.playing)
            this.calculateHashMove(aiStep); // ����������� ���� ������������� ����� (��� ��������)
        console.log(++this.step + ': ' + n + ', ' + m);
        return {n: n, m: m};
    };

    this.calculateHashMove = function(attack) { // ������ ����� ������������� ����� (��� ��������), ������ �� ���������� � � � ����� (�������� � ������ ����)
        for (var key in this.directions) {
            var n = this.n + this.directions[key].n;
            var m = this.m + this.directions[key].m;
            if (n < 0 || m < 0 || n >= this.size || m >= this.size)
                continue;
            if (this.matrix[n][m] !== 0)
                continue;
            if (!(n in this.hashStep))
                this.hashStep[n] = {};
            if (!(m in this.hashStep[n]))
                this.hashStep[n][m] = {sum: 0, attack: 0, defence: 0, attackPattern: 0, defencePattern: 0};
            if (attack)
                this.hashStep[n][m].attack += this.directions[key].w;
            else
                this.hashStep[n][m].defence += this.directions[key].w;
        }
    };

    this.calculateHashMovePattern = function() { // ������ ����� ������������� ����� �� �������� ��������
        var s;
        var k = 0;
        var attack = 2 - this.who;
        var defence = 2 - !this.who;
        var res;
        for (n in this.hashStep)
            for (m in this.hashStep[n]) // ������� ���� ������������� ����� (*1)
            {
                this.hashStep[n][m].sum = this.hashStep[n][m].attack + this.hashStep[n][m].defence;
                this.hashStep[n][m].attackPattern = 0; // �������� �������� ����� �� �������
                this.hashStep[n][m].defencePattern = 0; // �������� �������� ������ �� �������
                n = parseInt(n);
                m = parseInt(m);
                for (var q = 1; q <= 2; q++) // ������ �������� ����������� ���� �����, ������ - ���� ������
                    for (var j = 1; j <= 4; j++) 
                    {
                        s = '';
                        for (var i = -4; i <= 4; i++) // ����� �������� � ������� 4 ������ �� ���������������� ���� (����������� � *1)
                            switch (j) { // �������� ����� � ������� ���������� ������ �� 4 ������������, ������ ���� 000172222
                                case 1:  // ��� 7 - ��� ��������������� ���, 0-��������� ������, 1 - �������, 2 - �����
                                    if (n + i >= 0 && n + i < this.size)
                                        s += (i === 0) ? '7' : this.matrix[n + i][m];
                                    break;
                                case 2:
                                    if (m + i >= 0 && m + i < this.size)
                                        s += (i === 0) ? '7' : this.matrix[n][m + i];
                                    break;
                                case 3:
                                    if (n + i >= 0 && n + i < this.size)
                                        if (m + i >= 0 && m + i < this.size)
                                            s += (i === 0) ? '7' : this.matrix[n + i][m + i];
                                    break;
                                case 4:
                                    if (n - i >= 0 && n - i < this.size)
                                        if (m + i >= 0 && m + i < this.size)
                                            s += (i === 0) ? '7' : this.matrix[n - i][m + i];
                                    break;
                            }
                        res = (q === 1) ? this.patternWin[2 + attack].exec(s) : this.patternWin[2 + defence].exec(s);
                        if (res === null)
                            continue;
                        if (res[0].length < 5) // ���� ����� ��������� ����� <5, �� ��������� 5 �� ������� � �������� � ������ ����� �� �����������
                            continue;          // ��������, ��� ���������� ��������� ��� ������ (0, 0) ��� (0, 1) ��� ���� � 2� ������ ����� �������� 
                        if (q === 1) // ��� ���������, ���� ������ ���������� � �������. ��������� ��� ����� �� ���� ����
                            for (var i in this.pattern[attack]) { // ������� �� ���� ��������
                                if (this.pattern[attack][i].test(s)) // ���� ����� ������������
                                    this.hashStep[n][m].attackPattern += this.pattern[0][i]; // ����������� ���������� ������ �� ��� �������
                            }
                        else // ��� ������� ���� ������ ����������
                            for (var i in this.pattern[defence])
                                if (this.pattern[defence][i].test(s))
                                    this.hashStep[n][m].defencePattern += this.pattern[0][i];
                    }
                this.hashStep[n][m].sum += 1.1 * this.hashStep[n][m].attackPattern + this.hashStep[n][m].defencePattern; // ����� �� 10% ������ ������
                k++;
            }
    };

    this.init();
};
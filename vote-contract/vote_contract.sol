// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {

    // ✅ 3 stări posibile
    enum ElectionState { PREPARATION, OPEN, CLOSED }

    address public owner;
    ElectionState public state;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public registeredVoters;
    address[] public votersList;

    uint256 public candidatesCount;

    // ✅ Evenimente
    event StateChanged(ElectionState newState);
    event CandidateAdded(uint256 id, string name);
    event VoterRegistered(address voter);
    event Voted(address indexed voter, uint256 candidateId);
    event ElectionReset();

    // ✅ Modificatori
    modifier onlyOwner() {
        require(msg.sender == owner, "Doar owner-ul poate face asta");
        _;
    }

    modifier inState(ElectionState _state) {
        require(state == _state, "Actiune invalida in starea curenta");
        _;
    }

    modifier onlyRegistered() {
        require(registeredVoters[msg.sender], "Nu esti inregistrat ca votant");
        _;
    }

    constructor() {
        owner = msg.sender;
        state = ElectionState.PREPARATION; // incepe in PREPARATION
    }

    // ============================================
    // PREPARATION — adaugi candidati si votanti
    // ============================================

    function addCandidate(string memory _name) 
        external 
        onlyOwner 
        inState(ElectionState.PREPARATION) 
    {
        require(bytes(_name).length > 0, "Numele nu poate fi gol");
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function registerVoter(address _voter) 
        external 
        onlyOwner 
        inState(ElectionState.PREPARATION) 
    {
        require(_voter != address(0), "Adresa invalida");
        require(!registeredVoters[_voter], "Votant deja inregistrat");

        registeredVoters[_voter] = true;
        votersList.push(_voter);
        emit VoterRegistered(_voter);
    }

    // ============================================
    // TRANZITII INTRE STARI
    // ============================================

    // PREPARATION → OPEN
    function openElection() 
        external 
        onlyOwner 
        inState(ElectionState.PREPARATION) 
    {
        require(candidatesCount >= 2, "Trebuie cel putin 2 candidati");
        require(votersList.length > 0, "Trebuie cel putin un votant inregistrat");

        state = ElectionState.OPEN;
        emit StateChanged(ElectionState.OPEN);
    }

    // OPEN → CLOSED
    function closeElection() 
        external 
        onlyOwner 
        inState(ElectionState.OPEN) 
    {
        state = ElectionState.CLOSED;
        emit StateChanged(ElectionState.CLOSED);
    }

    // ORICE STARE → PREPARATION (reset complet)
    function resetElection() external onlyOwner {
        // sterge candidatii
        for (uint256 i = 1; i <= candidatesCount; i++) {
            delete candidates[i];
        }
        candidatesCount = 0;

        // sterge voturile si votantii
        for (uint256 i = 0; i < votersList.length; i++) {
            hasVoted[votersList[i]] = false;
            registeredVoters[votersList[i]] = false;
        }
        delete votersList;

        // inapoi la PREPARATION
        state = ElectionState.PREPARATION;
        emit ElectionReset();
        emit StateChanged(ElectionState.PREPARATION);
    }

    // ============================================
    // OPEN — votare
    // ============================================

    function vote(uint256 _candidateId) 
        external 
        onlyRegistered
        inState(ElectionState.OPEN) 
    {
        require(!hasVoted[msg.sender], "Ai votat deja");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount, 
            "Candidat invalid"
        );

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit Voted(msg.sender, _candidateId);
    }

    // ============================================
    // CITIRE DATE — view functions (fara gas)
    // ============================================

    function getCandidate(uint256 _id) 
        external 
        view 
        returns (string memory name, uint256 voteCount) 
    {
        require(_id > 0 && _id <= candidatesCount, "Candidat inexistent");
        return (candidates[_id].name, candidates[_id].voteCount);
    }

    function getWinner() 
        external 
        view 
        inState(ElectionState.CLOSED)
        returns (string memory winnerName, uint256 winnerVotes) 
    {
        require(candidatesCount > 0, "Nu exista candidati");

        uint256 maxVotes = 0;
        uint256 winnerId = 0;

        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }

        return (candidates[winnerId].name, candidates[winnerId].voteCount);
    }

    function getTotalVotes() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i <= candidatesCount; i++) {
            total += candidates[i].voteCount;
        }
        return total;
    }

    function getVotersCount() external view returns (uint256) {
        return votersList.length;
    }

    function getCurrentState() external view returns (string memory) {
        if (state == ElectionState.PREPARATION) return "PREPARATION";
        if (state == ElectionState.OPEN) return "OPEN";
        return "CLOSED";
    }
}
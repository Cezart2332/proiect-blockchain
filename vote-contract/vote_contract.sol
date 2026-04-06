// SPDX-License-Identifier: MIT
// 1. ✅ Directiva de compatibilitate
pragma solidity ^0.8.0;

contract VotingSystem {

    address public owner;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public registeredVoters;

    uint256 public candidatesCount;
    bool public votingOpen;

    event Voted(address indexed voter, uint256 candidateId);
    event CandidateAdded(uint256 id, string name);
    event VotingStatusChanged(bool isOpen);

    modifier onlyOwner() {
        require(msg.sender == owner, "Doar owner-ul poate face asta");
        _;
    }

    modifier onlyRegistered() {
        require(registeredVoters[msg.sender], "Nu esti inregistrat ca votant");
        _;
    }

    modifier whenVotingOpen() {
        require(votingOpen, "Votarea nu este deschisa");
        _;
    }

    constructor() {
        owner = msg.sender;
        votingOpen = false;
    }

    function addCandidate(string memory _name) external onlyOwner {
        // 4. ✅ require pentru validare
        require(bytes(_name).length > 0, "Numele nu poate fi gol");
        require(!votingOpen, "Nu poti adauga candidati in timpul votului");

        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function registerVoter(address _voter) external onlyOwner {
        require(_voter != address(0), "Adresa invalida");
        require(!registeredVoters[_voter], "Votantul e deja inregistrat");

        registeredVoters[_voter] = true;
    }

    function setVotingStatus(bool _status) external onlyOwner {
        // 4. ✅ assert pentru consistență internă
        assert(candidatesCount > 0); // trebuie sa existe cel putin un candidat
        votingOpen = _status;
        emit VotingStatusChanged(_status);
    }

    function vote(uint256 _candidateId) external onlyRegistered whenVotingOpen {
        require(!hasVoted[msg.sender], "Ai votat deja");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Candidat invalid");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit Voted(msg.sender, _candidateId);
    }

    function getCandidate(uint256 _id) external view returns (string memory name, uint256 voteCount) {
        require(_id > 0 && _id <= candidatesCount, "Candidat inexistent");
        Candidate memory c = candidates[_id];
        return (c.name, c.voteCount);
    }

    function getWinner() external view returns (string memory winnerName, uint256 winnerVotes) {
        require(!votingOpen, "Votarea inca nu s-a incheiat");
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
}
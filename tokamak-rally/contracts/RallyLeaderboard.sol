// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RallyLeaderboard {
    struct Record {
        address player;
        uint256 time;        // milliseconds
        string carId;        // e.g. "alpine_white"
        bytes32 replayHash;  // hash of replay data for future verification
        uint256 timestamp;
    }
    
    // All records
    Record[] public records;
    
    // Best time per player
    mapping(address => uint256) public bestTime;
    mapping(address => uint256) public bestRecordIndex;
    
    // Player nickname (optional)
    mapping(address => string) public nicknames;
    
    event RecordSubmitted(address indexed player, uint256 time, string carId, uint256 index);
    event NicknameSet(address indexed player, string nickname);
    
    function submitRecord(uint256 _time, string calldata _carId, bytes32 _replayHash) external {
        uint256 idx = records.length;
        records.push(Record(msg.sender, _time, _carId, _replayHash, block.timestamp));
        
        if (bestTime[msg.sender] == 0 || _time < bestTime[msg.sender]) {
            bestTime[msg.sender] = _time;
            bestRecordIndex[msg.sender] = idx;
        }
        
        emit RecordSubmitted(msg.sender, _time, _carId, idx);
    }
    
    function setNickname(string calldata _nickname) external {
        nicknames[msg.sender] = _nickname;
        emit NicknameSet(msg.sender, _nickname);
    }
    
    function getRecordCount() external view returns (uint256) {
        return records.length;
    }
    
    function getRecord(uint256 idx) external view returns (Record memory) {
        return records[idx];
    }
    
    // Get top N records (sorted off-chain, this returns all for client sorting)
    function getAllBestRecords(address[] calldata players) external view returns (Record[] memory, string[] memory) {
        Record[] memory bests = new Record[](players.length);
        string[] memory names = new string[](players.length);
        for (uint i = 0; i < players.length; i++) {
            if (bestTime[players[i]] > 0) {
                bests[i] = records[bestRecordIndex[players[i]]];
            }
            names[i] = nicknames[players[i]];
        }
        return (bests, names);
    }
}

#include <iostream>
#include <fstream>
#include <sstream>
#include <unordered_map>
#include <unordered_set>
#include <string>
using namespace std;

// File paths
const string USERS_FILE = "users.txt";
const string FRIENDSHIPS_FILE = "friendships.txt";
const string INPUT_FILE = "input.txt";
const string OUTPUT_FILE = "output.txt";

unordered_map<string, unordered_set<string>> adjList;

void load_users() {
    ifstream fin(USERS_FILE);
    string user;
    while (getline(fin, user)) {
        if (!user.empty()) adjList[user];
    }
}

void load_friendships() {
    ifstream fin(FRIENDSHIPS_FILE);
    string u, v;
    while (fin >> u >> v) {
        adjList[u].insert(v);
        adjList[v].insert(u);
    }
}

void save_user(const string& user) {
    ofstream fout(USERS_FILE, ios::app);
    fout << user << endl;
}

void save_friendship(const string& u, const string& v) {
    ofstream fout(FRIENDSHIPS_FILE, ios::app);
    fout << u << " " << v << endl;
}

void add_user(const string& user, ostream& out) {
    if (adjList.count(user)) {
        out << "User already exists." << endl;
        return;
    }
    adjList[user];
    save_user(user);
    out << "User added: " << user << endl;
}

void add_friendship(const string& u, const string& v, ostream& out) {
    if (!adjList.count(u) || !adjList.count(v)) {
        out << "One or both users do not exist." << endl;
        return;
    }
    if (adjList[u].count(v)) {
        out << "Friendship already exists." << endl;
        return;
    }
    adjList[u].insert(v);
    adjList[v].insert(u);
    save_friendship(u, v);
    out << "Friendship added: " << u << " <-> " << v << endl;
}

void suggest(const string& user, ostream& out) {
    if (!adjList.count(user)) {
        out << "User does not exist." << endl;
        return;
    }
    unordered_map<string, int> mutuals;
    for (const auto& friend1 : adjList[user]) {
        for (const auto& friend2 : adjList[friend1]) {
            if (friend2 != user && !adjList[user].count(friend2)) {
                mutuals[friend2]++;
            }
        }
    }
    if (mutuals.empty()) {
        out << "No suggestions." << endl;
        return;
    }
    out << "Friend suggestions for " << user << ": ";
    for (const auto& p : mutuals) {
        out << p.first << " (" << p.second << ") ";
    }
    out << endl;
}

void process_command(const string& line, ostream& out) {
    istringstream iss(line);
    string cmd;
    iss >> cmd;
    if (cmd == "add_user") {
        string user;
        iss >> user;
        add_user(user, out);
    } else if (cmd == "add_friendship") {
        string u, v;
        iss >> u >> v;
        add_friendship(u, v, out);
    } else if (cmd == "suggest") {
        string user;
        iss >> user;
        suggest(user, out);
    } else {
        out << "Unknown command." << endl;
    }
}

int main() {
    load_users();
    load_friendships();
    ifstream fin(INPUT_FILE);
    ofstream fout(OUTPUT_FILE);
    string line;
    while (getline(fin, line)) {
        if (!line.empty()) process_command(line, fout);
    }
    return 0;
} 
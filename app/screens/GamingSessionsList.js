import React, { Component, PureComponent } from "react";
import PropTypes from "prop-types";
import {
  ActivityIndicator,
  Alert,
  AsyncStorage,
  FlatList,
  Keyboard,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Notifications } from "expo";

import moment from "moment";
import Environment from "../config/environment";
import { registerForPushNotificationsAsync } from "../utils/expoPushNotifications";

import { colors, fontSizes, fontStyles, styleSheet } from "../../app/styles";
import GamingSessionsItem from "../components/GamingSessionsItem/GamingSessionsItem";
import GamingSessionsFilter from "../components/GamingSessionsFilter/GamingSessionsFilter";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import TopNav from "../components/TopNav/TopNav";
import Tabs from "../components/Tabs/Tabs";
import { connect } from "react-redux";
import { connectAlert } from "../components/Alert";
import { fetchGames } from "../actions/search";
import { changeGamingSessionsPage, changePlatform } from "../actions/search";
import { updateUserPushToken } from "../actions/users";
import { removeToken } from "../actions/authentication";
import {
  fetchGamingSessions,
  refreshGamingSessions,
  loadMoreGamingSessions,
  fetchMyGamingSessions,
  refreshMyGamingSessions,
  loadMoreMyGamingSessions,
  fetchGroupGamingSessions,
  refreshGroupGamingSessions,
  loadMoreGroupGamingSessions,
  fetchRecentGamingSessions,
  refreshRecentGamingSessions,
  loadMoreRecentGamingSessions
} from "../actions/gamingSessions";

class GamingSessionsList extends PureComponent {
  static propTypes = {
    activity: PropTypes.string,
    game: PropTypes.object,
    gameId: PropTypes.number,
    notFull: PropTypes.number,
    page: PropTypes.number,
    platform: PropTypes.string,
    isLoading: PropTypes.bool,
    // refreshing: PropTypes.bool,
    moreDataAvailable: PropTypes.bool,
    gamingSessions: PropTypes.array,
    myGamingSessions: PropTypes.array,
    groupGamingSessions: PropTypes.array
  };
  constructor(props) {
    super(props);
    this.updateFilter = this.updateFilter.bind(this);
  }

  state = {
    notification: {}
  };

  componentDidMount() {
    // Todo: save search settings in local storage and retrieve
    // AsyncStorage.getItem("search_platform").then(platform => {
    //   if (platform) {
    //     console.log("platform in local storage: ", platform)
    //     this.props.dispatch(changePlatform(platform));
    //   }
    // });
    this.fetchGamingSessionsData();

    registerForPushNotificationsAsync().then(token => {
      if (
        token &&
        (this.props.user.expo_push_token == null ||
          this.props.user.expo_push_token !== token)
      ) {
        this.props.dispatch(updateUserPushToken(token));
      }
      this._notificationSubscription = Notifications.addListener(
        this._handleNotification
      );
    });
    Notifications.setBadgeNumberAsync(0);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.gamingSessionsError &&
      nextProps.gamingSessionsError !== this.props.gamingSessionsError
    ) {
      this.props.alertWithType("error", "Error", nextProps.gamingSessionsError);
    }
  }

  _handleNotification = notification => {
    console.log(notification);
    if (notification.origin === "selected") {
      this.props.navigation.navigate("NotificationsList");
    } else {
      this.props.alertWithType("info", "", notification.data.message);
    }
  };

  fetchGamesData() {
    this.props.dispatch(fetchGames());
  }

  updateFilter() {
    console.log(this.searchUrl());
    this.props.dispatch(fetchGamingSessions(this.searchUrl()));
  }

  searchUrl() {
    let platform = this.props.platform;
    console.log("PLATFORM: ", platform);

    if (this.props.platform == null) {
      platform = this.props.user.platform;
    }
    console.log("PLATFORM: ", platform);

    return encodeURI(
      Environment["API_BASE_URL"] +
        Environment["API_VERSION"] +
        "gaming_sessions" +
        // this.props.gamingSessionsPage +
        "?q[game_id_eq]=" +
        this.props.gameId +
        "&q[platform_cont]=" +
        platform +
        "&q[category_cont]=" +
        this.props.activity +
        "&q[with_available_slots]=" +
        this.props.notFull
    );
  }

  fetchGamingSessionsData() {
    this.props.dispatch(fetchGamingSessions(this.searchUrl()));
    this.props.dispatch(fetchMyGamingSessions());
    this.props.dispatch(fetchGroupGamingSessions());
    this.props.dispatch(fetchRecentGamingSessions());
  }

  refreshGames = () => {
    console.log("refreshGames Triggered");
    if (this.props.gamingSessionsRefreshing === false) {
      this.props.dispatch(refreshGamingSessions(this.searchUrl()));
    }
  };

  refreshMyGames = () => {
    console.log("refreshMyGames Triggered");
    if (this.props.myGamingSessionsRefreshing === false) {
      this.props.dispatch(refreshMyGamingSessions());
    }
  };

  refreshGroupGames = () => {
    console.log("refreshGroupGames Triggered");
    if (this.props.groupGamingSessionsRefreshing === false) {
      this.props.dispatch(refreshGroupGamingSessions());
    }
  };

  refreshRecentGames = () => {
    console.log("refreshRecentGames Triggered");
    if (this.props.recentGamingSessionsRefreshing === false) {
      this.props.dispatch(refreshRecentGamingSessions());
    }
  };

  loadMoreGamingSessions = () => {
    if (
      this.props.gamingSessionsRefreshing === false &&
      this.props.moreGamingSessionsAvailable === true
    ) {
      console.log("LoadMoreGamingSessions Activated");
      this.props.dispatch(loadMoreGamingSessions(this.searchUrl()));
    }
  };

  loadMoreMyGamingSessions = () => {
    if (
      this.props.myGamingSessionsRefreshing === false &&
      this.props.moreMyGamingSessionsAvailable === true
    ) {
      console.log("LoadMoreMyGamingSessions Activated");
      this.props.dispatch(loadMoreMyGamingSessions(this.searchUrl()));
    }
  };

  loadMoreGroupGamingSessions = () => {
    if (
      this.props.groupGamingSessionsRefreshing === false &&
      this.props.moreGroupGamingSessionsAvailable === true
    ) {
      console.log("LoadMoreGroupGamingSessions Activated");
      this.props.dispatch(loadMoreGroupGamingSessions());
    }
  };

  loadMoreRecentGamingSessions = () => {
    if (
      this.props.recentGamingSessionsRefreshing === false &&
      this.props.moreRecentGamingSessionsAvailable === true
    ) {
      console.log("LoadMoreRecentGamingSessions Activated");
      this.props.dispatch(loadMoreRecentGamingSessions(this.searchUrl()));
    }
  };

  gamesOnDate = (data, date) => {
    // this.uniqueDates(this.props.data);
    let games = data.filter(function(gamingSession) {
      return (
        moment(gamingSession.start_time)
          .startOf("day")
          .format("dddd MM-DD-YYYY") === date
      );
    });
    return games;
  };

  uniqueDates = array => {
    let allDates = array.map(function(item) {
      return moment(item["start_time"])
        .startOf("day")
        .format("dddd MM-DD-YYYY");
    });

    return allDates.reduce(function(result, number) {
      if (!result.includes(number)) {
        result.push(number);
      }
      return result;
    }, []);
  };

  gamingSessionsArray = data => {
    let array = this.uniqueDates(data);
    let games = array.map(date => ({
      title: date,
      data: this.gamesOnDate(data, date)
    }));
    return games;
  };

  renderFooter = () => {
    if (!this.props.moreGamingSessionsAvailable) {
      return (
        <View style={styles.alertView}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={colors.mediumGrey}
          />
        </View>
      );
    } else {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
        </View>
      );
    }
  };

  renderGroupFooter = () => {
    if (!this.props.moreGroupGamingSessionsAvailable) {
      return (
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View style={styles.alertView}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={24}
              color={colors.mediumGrey}
            />
          </View>
        </TouchableWithoutFeedback>
      );
    } else {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
        </View>
      );
    }
  };

  renderMyFooter = () => {
    if (!this.props.moreMyGamingSessionsAvailable) {
      return (
        <View style={styles.alertView}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={colors.mediumGrey}
          />
        </View>
      );
    } else {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
        </View>
      );
    }
  };

  renderRecentFooter = () => {
    if (!this.props.moreRecentGamingSessionsAvailable) {
      return (
        <View style={styles.alertView}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={colors.mediumGrey}
          />
        </View>
      );
    } else {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
        </View>
      );
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <TopNav
          user={this.props.user}
          navigation={this.props.navigation}
          newGameButton={true}
          searchButton={
            <GamingSessionsFilter updateFilter={this.updateFilter} />
          }
        />

        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <Tabs>
            <View title="PUBLIC GAMES" style={styles.content}>
              <SectionList
                renderItem={({ item }) => (
                  <GamingSessionsItem
                    data={item}
                    navigation={this.props.navigation}
                  />
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <View
                    style={{
                      padding: 5,
                      paddingTop: 15,
                      backgroundColor: colors.lightGray
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{title}</Text>
                  </View>
                )}
                sections={this.gamingSessionsArray(this.props.gamingSessions)}
                ListHeaderComponent={this.renderEmpty}
                ListFooterComponent={this.renderFooter}
                ListEmptyComponent={this.renderEmpty}
                extraData={this.props.gamingSessions}
                // Getting errors using game id
                // keyExtractor={item => item.id}
                keyExtractor={(item, index) => index}
                refreshing={this.props.gamingSessionsRefreshing}
                onRefresh={this.refreshGames}
                onEndReached={this.loadMoreGamingSessions}
                onEndReachedThreshold={0.8}
              />
            </View>

            <View title="GROUP GAMES" style={styles.content}>
              <SectionList
                // data={this.props.groupGamingSessions}
                renderItem={({ item }) => (
                  <GamingSessionsItem
                    data={item}
                    navigation={this.props.navigation}
                  />
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <View
                    style={{
                      padding: 5,
                      paddingTop: 15,
                      backgroundColor: colors.lightGray
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{title}</Text>
                  </View>
                )}
                sections={this.gamingSessionsArray(
                  this.props.groupGamingSessions
                )}
                ListHeaderComponent={this.renderEmpty}
                ListFooterComponent={this.renderGroupFooter}
                ListEmptyComponent={this.renderEmpty}
                extraData={this.props}
                keyExtractor={(item, index) => index}
                refreshing={this.props.groupGamingSessionsRefreshing}
                onRefresh={this.refreshGroupGames}
                onEndReached={this.loadMoreGroupGamingSessions}
                onEndReachedThreshold={0}
              />
            </View>
            <View title="MY GAMES" style={styles.content}>
              <SectionList
                // data={this.props.myGamingSessions}
                renderItem={({ item }) => (
                  <GamingSessionsItem
                    data={item}
                    navigation={this.props.navigation}
                  />
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <View
                    style={{
                      padding: 5,
                      paddingTop: 15,
                      backgroundColor: colors.lightGray
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{title}</Text>
                  </View>
                )}
                sections={this.gamingSessionsArray(this.props.myGamingSessions)}
                ListHeaderComponent={this.renderEmpty}
                ListFooterComponent={this.renderMyFooter}
                extraData={this.props.myGamingSessions}
                keyExtractor={(item, index) => index}
                refreshing={this.props.myGamingSessionsRefreshing}
                onRefresh={this.refreshMyGames}
                onEndReached={this.loadMoreMyGamingSessions}
                onEndReachedThreshold={0}
              />
            </View>
            <View title="RECENT GAMES" style={styles.content}>
              <SectionList
                // data={this.props.myGamingSessions}
                renderItem={({ item }) => (
                  <GamingSessionsItem
                    data={item}
                    navigation={this.props.navigation}
                  />
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <View
                    style={{
                      padding: 5,
                      paddingTop: 15,
                      backgroundColor: colors.lightGray
                    }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{title}</Text>
                  </View>
                )}
                sections={this.gamingSessionsArray(
                  this.props.recentGamingSessions
                )}
                ListHeaderComponent={this.renderEmpty}
                ListFooterComponent={this.renderRecentFooter}
                extraData={this.props.recentGamingSessions}
                keyExtractor={(item, index) => index}
                refreshing={this.props.recentGamingSessionsRefreshing}
                onRefresh={this.refreshRecentGames}
                onEndReached={this.loadMoreRecentGamingSessions}
                onEndReachedThreshold={0}
              />
            </View>
          </Tabs>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: styleSheet.spacing.small,
    backgroundColor: colors.lightGray
  },
  content: {
    flex: 1,
    backgroundColor: colors.lightGray
  },
  alertView: {
    flexDirection: "row",
    justifyContent: "center",
    height: 50
  }
});

const mapStateToProps = state => {
  const activity = state.search.activity;
  const gameId = state.search.gameId;
  const game = state.search.games[gameId] || {};
  const notFull = state.search.notFull;
  const platform = state.search.platform;

  const gamingSessionsRefreshing =
    state.gamingSessions.gamingSessionsRefreshing;
  const groupGamingSessionsRefreshing =
    state.gamingSessions.groupGamingSessionsRefreshing;
  const myGamingSessionsRefreshing =
    state.gamingSessions.myGamingSessionsRefreshing;
  const recentGamingSessionsRefreshing =
    state.gamingSessions.recentGamingSessionsRefreshing;

  const moreDataAvailable = state.gamingSessions.moreDataAvailable;
  const gamingSessions = state.gamingSessions.gamingSessions;
  const myGamingSessions = state.gamingSessions.myGamingSessions;
  const groupGamingSessions = state.gamingSessions.groupGamingSessions;
  const recentGamingSessions = state.gamingSessions.recentGamingSessions;

  const moreGamingSessionsAvailable =
    state.gamingSessions.moreGamingSessionsAvailable;
  const moreMyGamingSessionsAvailable =
    state.gamingSessions.moreMyGamingSessionsAvailable;
  const moreGroupGamingSessionsAvailable =
    state.gamingSessions.moreGroupGamingSessionsAvailable;
  const moreRecentGamingSessionsAvailable =
    state.gamingSessions.moreRecentGamingSessionsAvailable;

  const user = state.users.currentUser;
  return {
    activity,
    game,
    gameId,
    platform,
    notFull,
    moreDataAvailable,
    user,

    gamingSessionsRefreshing,
    myGamingSessionsRefreshing,
    groupGamingSessionsRefreshing,
    recentGamingSessionsRefreshing,

    gamingSessions,
    myGamingSessions,
    groupGamingSessions,
    recentGamingSessions,

    moreGamingSessionsAvailable,
    moreMyGamingSessionsAvailable,
    moreGroupGamingSessionsAvailable,
    moreRecentGamingSessionsAvailable,

    gamingSessionsError: state.gamingSessions.error
  };
};

export default connect(mapStateToProps)(connectAlert(GamingSessionsList));

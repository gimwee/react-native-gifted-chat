import PropTypes from 'prop-types'
import React, { RefObject } from 'react'

import {
  FlatList,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ListViewProps,
  ListRenderItemInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
  Platform,
  ViewToken,
} from 'react-native'

import LoadEarlier from './LoadEarlier'
import Message from './Message'
import Color from './Color'
import { User, IMessage, Reply } from './Models'
import { warning, StylePropType } from './utils'
import TypingIndicator from './TypingIndicator'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerAlignTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  emptyChatContainer: {
    flex: 1,
    transform: [{ scaleY: -1 }],
  },
  headerWrapper: {
    flex: 1,
  },
  listStyle: {
    flex: 1,
  },
  scrollToBottomStyle: {
    opacity: 0.8,
    position: 'absolute',
    right: 10,
    bottom: 30,
    zIndex: 999,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: Color.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Color.black,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 1,
  },
  scrollToUnreadButtonStyle: {
    width: 170,
    height: 30,
    position: 'absolute',
    top: 100,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#F0FBFE'
  },
  scrollToUnreadButtonTextStyle: {
    color: '#616264',
    fontSize: 12,
    lineHeight: 20,
  }
})

export interface MessageContainerProps<TMessage extends IMessage> {
  messages?: TMessage[]
  isTyping?: boolean
  user?: User
  listViewProps: Partial<ListViewProps>
  inverted?: boolean
  loadEarlier?: boolean
  alignTop?: boolean
  scrollToBottom?: boolean
  scrollToBottomStyle?: StyleProp<ViewStyle>
  invertibleScrollViewProps?: any
  extraData?: any
  scrollToBottomOffset?: number
  forwardRef?: RefObject<FlatList<IMessage>>
  renderChatEmpty?(): React.ReactNode
  renderFooter?(props: MessageContainerProps<TMessage>): React.ReactNode
  renderMessage?(props: Message['props']): React.ReactNode
  renderLoadEarlier?(props: LoadEarlier['props']): React.ReactNode
  scrollToBottomComponent?(): React.ReactNode
  onLoadEarlier?(): void
  onQuickReply?(replies: Reply[]): void
  infiniteScroll?: boolean
  isLoadingEarlier?: boolean
  lastUnreadIndex: number
  resetLastUnreadIndex(): void
}

interface State {
  showScrollBottom: boolean
  showScrollToIndexButton: boolean
}

export default class MessageContainer<
  TMessage extends IMessage = IMessage
> extends React.PureComponent<MessageContainerProps<TMessage>, State> {
  static defaultProps = {
    messages: [],
    user: {},
    isTyping: false,
    renderChatEmpty: null,
    renderFooter: null,
    renderMessage: null,
    onLoadEarlier: () => {},
    onQuickReply: () => {},
    inverted: true,
    loadEarlier: false,
    listViewProps: {},
    invertibleScrollViewProps: {},
    extraData: null,
    scrollToBottom: false,
    scrollToBottomOffset: 200,
    alignTop: false,
    scrollToBottomStyle: {},
    infiniteScroll: false,
    isLoadingEarlier: false,
    lastUnreadIndex: 0,
    resetLastUnreadIndex: () => {}
  }

  static propTypes = {
    messages: PropTypes.arrayOf(PropTypes.object),
    isTyping: PropTypes.bool,
    user: PropTypes.object,
    renderChatEmpty: PropTypes.func,
    renderFooter: PropTypes.func,
    renderMessage: PropTypes.func,
    renderLoadEarlier: PropTypes.func,
    onLoadEarlier: PropTypes.func,
    listViewProps: PropTypes.object,
    inverted: PropTypes.bool,
    loadEarlier: PropTypes.bool,
    invertibleScrollViewProps: PropTypes.object,
    extraData: PropTypes.object,
    scrollToBottom: PropTypes.bool,
    scrollToBottomOffset: PropTypes.number,
    scrollToBottomComponent: PropTypes.func,
    alignTop: PropTypes.bool,
    scrollToBottomStyle: StylePropType,
    infiniteScroll: PropTypes.bool,
    lastUnreadIndex: PropTypes.number,
    resetLastUnreadIndex: PropTypes.func,
  }

  state = {
    showScrollBottom: false,
    showScrollToIndexButton: false,
  }

  renderTypingIndicator = () => {
    if (Platform.OS === 'web') {
      return null
    }
    return <TypingIndicator isTyping={this.props.isTyping || false} />
  }

  renderFooter = () => {
    if (this.props.renderFooter) {
      return this.props.renderFooter(this.props)
    }

    return this.renderTypingIndicator()
  }

  renderLoadEarlier = () => {
    if (this.props.loadEarlier === true) {
      const loadEarlierProps = {
        ...this.props,
      }
      if (this.props.renderLoadEarlier) {
        return this.props.renderLoadEarlier(loadEarlierProps)
      }
      return <LoadEarlier {...loadEarlierProps} />
    }
    return null
  }

  scrollTo(options: { animated?: boolean; offset: number }) {
    if (this.props.forwardRef && this.props.forwardRef.current && options) {
      this.props.forwardRef.current.scrollToOffset(options)
    }
  }

  scrollToBottom = (animated: boolean = true) => {
    const { inverted } = this.props
    if (inverted) {
      this.scrollTo({ offset: 0, animated })
    } else if (this.props.forwardRef && this.props.forwardRef.current) {
      this.props.forwardRef!.current!.scrollToEnd({ animated })
    }
  }

  handleOnScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: { y: contentOffsetY },
        contentSize: { height: contentSizeHeight },
        layoutMeasurement: { height: layoutMeasurementHeight },
      },
    } = event
    const { scrollToBottomOffset } = this.props
    if (this.props.inverted) {
      if (contentOffsetY > scrollToBottomOffset!) {
        this.setState({ showScrollBottom: true })
      } else {
        this.setState({ showScrollBottom: false })
      }
    } else {
      if (
        contentOffsetY < scrollToBottomOffset! &&
        contentSizeHeight - layoutMeasurementHeight > scrollToBottomOffset!
      ) {
        this.setState({ showScrollBottom: true })
      } else {
        this.setState({ showScrollBottom: false })
      }
    }
  }

  renderRow = ({ item, index }: ListRenderItemInfo<TMessage>) => {
    if (!item._id && item._id !== 0) {
      warning('GiftedChat: `_id` is missing for message', JSON.stringify(item))
    }
    if (!item.user) {
      if (!item.system) {
        warning(
          'GiftedChat: `user` is missing for message',
          JSON.stringify(item),
        )
      }
      item.user = { _id: 0 }
    }
    const { messages, user, inverted, ...restProps } = this.props
    if (messages && user) {
      const previousMessage =
        (inverted ? messages[index + 1] : messages[index - 1]) || {}
      const nextMessage =
        (inverted ? messages[index - 1] : messages[index + 1]) || {}

      const messageProps: Message['props'] = {
        ...restProps,
        user,
        key: item._id,
        currentMessage: item,
        previousMessage,
        inverted,
        nextMessage,
        position: item.user._id === user._id ? 'right' : 'left',
      }

      if (this.props.renderMessage) {
        return this.props.renderMessage(messageProps)
      }
      return <Message {...messageProps} />
    }
    return null
  }

  renderChatEmpty = () => {
    if (this.props.renderChatEmpty) {
      return this.props.inverted ? (
        this.props.renderChatEmpty()
      ) : (
        <View style={styles.emptyChatContainer}>
          {this.props.renderChatEmpty()}
        </View>
      )
    }
    return <View style={styles.container} />
  }

  renderHeaderWrapper = () => (
    <View style={styles.headerWrapper}>{this.renderLoadEarlier()}</View>
  )

  renderScrollBottomComponent() {
    const { scrollToBottomComponent } = this.props

    if (scrollToBottomComponent) {
      return scrollToBottomComponent()
    }

    return <Text>V</Text>
  }

  renderScrollToBottomWrapper() {
    const propsStyle = this.props.scrollToBottomStyle || {}
    return (
      <View style={[styles.scrollToBottomStyle, propsStyle]}>
        <TouchableOpacity
          onPress={() => this.scrollToBottom()}
          hitSlop={{ top: 5, left: 5, right: 5, bottom: 5 }}
        >
          {this.renderScrollBottomComponent()}
        </TouchableOpacity>
      </View>
    )
  }

  onLayoutList = () => {
    if (
      !this.props.inverted &&
      !!this.props.messages &&
      this.props.messages!.length
    ) {
      setTimeout(
        () => this.scrollToBottom && this.scrollToBottom(false),
        15 * this.props.messages!.length,
      )
    }
  }

  onEndReached = ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    const {
      loadEarlier,
      onLoadEarlier,
      infiniteScroll,
      isLoadingEarlier,
    } = this.props
    if (
      infiniteScroll &&
      ((distanceFromEnd > 0 && distanceFromEnd <= 100) ||
        distanceFromEnd < 0) &&
      loadEarlier &&
      onLoadEarlier &&
      !isLoadingEarlier &&
      Platform.OS !== 'web'
    ) {
      onLoadEarlier()
    }
  }

  scrollToIndex = () => {
    const { lastUnreadIndex, forwardRef } = this.props;
    if(forwardRef){
      forwardRef.current?.scrollToIndex({ index: lastUnreadIndex, animated: true });
    }
  }

  onViewableItemsChanged = ({ viewableItems }: {viewableItems: ViewToken[]} ) => {
    const { lastUnreadIndex, resetLastUnreadIndex } = this.props;
    const { showScrollToIndexButton } = this.state;

    if(lastUnreadIndex) {
        const lastUnreadInView = viewableItems.find( item => item.index === lastUnreadIndex );
        if(!lastUnreadInView) {
          this.setState({showScrollToIndexButton: true})
        } else if(showScrollToIndexButton){
          setTimeout(() => { 
            resetLastUnreadIndex();
            this.setState({showScrollToIndexButton: false}) 
          }, 3000);
        } else if(lastUnreadIndex > 0) {
          setTimeout(() => {
              resetLastUnreadIndex();
          }, 3000);
        }
    }
  }

  handleScrollToIndexFailed = () => {
    const { forwardRef, lastUnreadIndex } = this.props;
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
        if(forwardRef){
          forwardRef.current?.scrollToIndex({ index: lastUnreadIndex-5, animated: true });
        }
    });
 }

  keyExtractor = (item: TMessage) => `${item._id}`

  render() {
    const { inverted, lastUnreadIndex } = this.props
    const { showScrollToIndexButton } = this.state

    return (
      <View
        style={
          this.props.alignTop ? styles.containerAlignTop : styles.container
        }
      >
        { showScrollToIndexButton &&
          <TouchableOpacity onPress={this.scrollToIndex} style={styles.scrollToUnreadButtonStyle}>
              <Text style={styles.scrollToUnreadButtonTextStyle}>Unread Message ({lastUnreadIndex+1})</Text>
          </TouchableOpacity>
        }
        
        {this.state.showScrollBottom && this.props.scrollToBottom
          ? this.renderScrollToBottomWrapper()
          : null}
        <FlatList
          ref={this.props.forwardRef}
          onViewableItemsChanged={this.onViewableItemsChanged }
          initialScrollIndex={0}  
          onScrollToIndexFailed={this.handleScrollToIndexFailed}
          extraData={[this.props.extraData, this.props.isTyping]}
          keyExtractor={this.keyExtractor}
          enableEmptySections
          automaticallyAdjustContentInsets={false}
          inverted={inverted}
          data={this.props.messages}
          style={styles.listStyle}
          contentContainerStyle={styles.contentContainerStyle}
          renderItem={this.renderRow}
          {...this.props.invertibleScrollViewProps}
          ListEmptyComponent={this.renderChatEmpty}
          ListFooterComponent={
            inverted ? this.renderHeaderWrapper : this.renderFooter
          }
          ListHeaderComponent={
            inverted ? this.renderFooter : this.renderHeaderWrapper
          }
          onScroll={this.handleOnScroll}
          scrollEventThrottle={100}
          onLayout={this.onLayoutList}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={0.1}
          {...this.props.listViewProps}
        />
      </View>
    )
  }
}

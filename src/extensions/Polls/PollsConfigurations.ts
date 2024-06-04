import { ImageType } from '../../shared';
import { PollsStyleInterface } from './Polls';
import { PollsBubbleStyleInterface } from './PollsBubble';

export interface PollsConfigurationInterface {
  createPollsStyle?: PollsStyleInterface;
  pollsBubbleStyle?: PollsBubbleStyleInterface;
  title?: string;
  questionPlaceholderText?: string;
  answerPlaceholderText?: string;
  answerHelpText?: string;
  addAnswerText?: string;
  deleteIcon?: ImageType;
  closeIcon?: ImageType;
  createPollIcon?: ImageType;
}

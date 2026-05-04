import { IsIn } from 'class-validator';

export class AddReactionDto {
  @IsIn(['thanks', 'helpful', 'went_there'])
  type: 'thanks' | 'helpful' | 'went_there';
}
